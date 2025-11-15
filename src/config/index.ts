import { config } from 'dotenv';

// Load environment variables
config();

export interface Config {
  server: {
    nodeEnv: string;
    port: number;
    host: string;
  };
  graphql: {
    endpoint: string;
    playground: boolean;
  };
  assets: {
    mode: 'development' | 'production';
    cdnUrl: string;
    localPath: string;
  };
  services: {
    userService: string;
    productService: string;
    notificationService: string;
  };
  serviceMesh: {
    serviceName: string;
    serviceVersion: string;
    clusterName: string;
  };
  healthCheck: {
    healthPath: string;
    readinessPath: string;
  };
  logging: {
    level: string;
    format: string;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  request: {
    timeout: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const getConfig = (): Config => {
  return {
    server: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '4000', 10),
      host: process.env.HOST || '0.0.0.0',
    },
    graphql: {
      endpoint: process.env.GRAPHQL_ENDPOINT || '/graphql',
      playground: process.env.GRAPHQL_PLAYGROUND === 'true',
    },
    assets: {
      mode: (process.env.ASSETS_MODE as 'development' | 'production') || 'development',
      cdnUrl: process.env.ASSETS_CDN_URL || 'https://cdn.example.com',
      localPath: process.env.ASSETS_LOCAL_PATH || './assets',
    },
    services: {
      userService: process.env.USER_SERVICE_URL || 'http://user-service:8080',
      productService: process.env.PRODUCT_SERVICE_URL || 'http://product-service:8080',
      notificationService: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8080',
    },
    serviceMesh: {
      serviceName: process.env.SERVICE_NAME || 'conduites-bff',
      serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
      clusterName: process.env.CLUSTER_NAME || 'development',
    },
    healthCheck: {
      healthPath: process.env.HEALTH_CHECK_PATH || '/health',
      readinessPath: process.env.READINESS_CHECK_PATH || '/ready',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    request: {
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  };
};

export const appConfig = getConfig();