import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './httpClient.js';

// Mock the config
vi.mock('../config/index.js', () => ({
  appConfig: {
    request: {
      timeout: 5000,
    },
    serviceMesh: {
      serviceName: 'graph-conduit-accounts',
      serviceVersion: '1.0.0',
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
global.AbortController = vi.fn().mockImplementation(() => ({
  abort: vi.fn(),
  signal: {},
}));

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient('http://example.com');
    mockFetch.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with base URL', () => {
      const client = new HttpClient('http://test.com');
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should remove trailing slash from base URL', () => {
      const client = new HttpClient('http://test.com/');
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should accept custom options', () => {
      const client = new HttpClient('http://test.com', {
        timeout: 10000,
        headers: { 'X-Custom': 'value' },
      });
      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { id: 1, name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'graph-conduit-accounts/1.0.0',
        }),
        body: undefined,
      });
      expect(result).toEqual({
        status: 200,
        data: mockResponse,
      });
    });

    it('should handle GET request with custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('/test', { 'X-Custom': 'header' });

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/test', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'graph-conduit-accounts/1.0.0',
          'X-Custom': 'header',
        }),
        body: undefined,
      });
    });

    it('should handle 404 error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await httpClient.get('/notfound');

      expect(result).toEqual({
        status: 404,
        error: 'HTTP 404: Not Found',
      });
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const postData = { name: 'test', value: 123 };
      const mockResponse = { id: 1, created: true };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await httpClient.post('/create', postData);

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/create', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'graph-conduit-accounts/1.0.0',
        }),
        body: JSON.stringify(postData),
      });
      expect(result).toEqual({
        status: 201,
        data: mockResponse,
      });
    });

    it('should handle POST without data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.post('/action');

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/action', {
        method: 'POST',
        headers: expect.any(Object),
        body: undefined,
      });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const putData = { id: 1, name: 'updated' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => putData,
      });

      const result = await httpClient.put('/update/1', putData);

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/update/1', {
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(putData),
      });
      expect(result.status).toBe(200);
      expect(result.data).toEqual(putData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      const result = await httpClient.delete('/item/1');

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/item/1', {
        method: 'DELETE',
        headers: expect.any(Object),
        body: undefined,
      });
      expect(result.status).toBe(204);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await httpClient.get('/test');

      expect(result).toEqual({
        status: 500,
        error: 'Network error',
      });
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Timeout'), { name: 'AbortError' }));

      const result = await httpClient.get('/test');

      expect(result).toEqual({
        status: 408,
        error: 'Request timeout',
      });
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await httpClient.get('/test');

      expect(result).toEqual({
        status: 500,
        error: 'Unknown error occurred',
      });
    });

    it('should handle HTTP error status codes', async () => {
      const testCases = [
        { status: 400, statusText: 'Bad Request' },
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 502, statusText: 'Bad Gateway' },
        { status: 503, statusText: 'Service Unavailable' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          statusText: testCase.statusText,
        });

        const result = await httpClient.get('/test');

        expect(result).toEqual({
          status: testCase.status,
          error: `HTTP ${testCase.status}: ${testCase.statusText}`,
        });

        mockFetch.mockClear();
      }
    });
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'OK' }),
      });

      const result = await httpClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith('http://example.com/health', expect.any(Object));
      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
      });
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle unhealthy service response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await httpClient.healthCheck();

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
      });
    });

    it('should handle health check errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await httpClient.healthCheck();

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
      });
    });
  });

  describe('Request Configuration', () => {
    it('should use default timeout from config', () => {
      const client = new HttpClient('http://test.com');
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should use custom timeout when provided', () => {
      const client = new HttpClient('http://test.com', { timeout: 10000 });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should include User-Agent header in all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'graph-conduit-accounts/1.0.0',
          }),
        })
      );
    });

    it('should merge custom headers with defaults', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('/test', {
        'X-Custom': 'value',
        'Authorization': 'Bearer token',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'graph-conduit-accounts/1.0.0',
            'X-Custom': 'value',
            'Authorization': 'Bearer token',
          }),
        })
      );
    });
  });

  describe('URL Construction', () => {
    it('should construct URLs correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('/path/to/resource');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/path/to/resource',
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('path/to/resource');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/path/to/resource',
        expect.any(Object)
      );
    });

    it('should handle root path', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await httpClient.get('/');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://example.com/',
        expect.any(Object)
      );
    });
  });

  describe('Response Types', () => {
    it('should return properly typed responses', async () => {
      interface TestData {
        id: number;
        name: string;
      }

      const mockResponse: TestData = { id: 1, name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await httpClient.get<TestData>('/test');

      expect(result.data).toEqual(mockResponse);
      expect(result.status).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      const result = await httpClient.get('/test');

      expect(result.data).toBeNull();
      expect(result.status).toBe(204);
    });
  });
});