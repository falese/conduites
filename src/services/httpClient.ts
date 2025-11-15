import { appConfig } from '../config/index.js';

interface HttpClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

interface ServiceResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, options: HttpClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = options.timeout || appConfig.request.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': `${appConfig.serviceMesh.serviceName}/${appConfig.serviceMesh.serviceVersion}`,
      ...options.headers,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ServiceResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const responseData = await response.json();
      return {
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            status: 408,
            error: 'Request timeout',
          };
        }
        return {
          status: 500,
          error: error.message,
        };
      }
      return {
        status: 500,
        error: 'Unknown error occurred',
      };
    }
  }

  async get<T>(path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>('GET', path, undefined, headers);
  }

  async post<T>(path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>('POST', path, data, headers);
  }

  async put<T>(path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>('PUT', path, data, headers);
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }

  // Health check method for service mesh monitoring
  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    try {
      const response = await this.get('/health');
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
      };
    }
  }
}