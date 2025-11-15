import express from 'express';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema/index.js';
import { appConfig } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { corsHandler, securityHeaders, serviceMeshHeaders } from './middleware/security.js';
import { healthCheck, readinessCheck } from './middleware/health.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Trust proxy headers (for service mesh/load balancer)
app.set('trust proxy', true);

// Apply global middleware
app.use(corsHandler);
app.use(securityHeaders);
app.use(serviceMeshHeaders);
app.use(requestLogger);
app.use(express.json());

// Health check endpoints (before other routes)
app.get(appConfig.healthCheck.healthPath, healthCheck);
app.get(appConfig.healthCheck.readinessPath, readinessCheck);

// Static asset serving logic
if (appConfig.assets.mode === 'development') {
  // Development mode: serve static files locally
  console.log('Development mode: serving static assets from', appConfig.assets.localPath);
  app.use('/assets', express.static(path.resolve(appConfig.assets.localPath)));
  
  // Serve MFE assets endpoint
  app.get('/api/assets-config', (req, res) => {
    res.json({
      mode: 'development',
      baseUrl: `http://${appConfig.server.host}:${appConfig.server.port}/assets`,
      cdnUrl: null,
    });
  });
} else {
  // Production mode: return CDN URLs
  console.log('Production mode: using CDN assets from', appConfig.assets.cdnUrl);
  
  app.get('/api/assets-config', (req, res) => {
    res.json({
      mode: 'production',
      baseUrl: appConfig.assets.cdnUrl,
      cdnUrl: appConfig.assets.cdnUrl,
    });
  });
}

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema,
  graphqlEndpoint: appConfig.graphql.endpoint,
  graphiql: appConfig.graphql.playground && appConfig.server.nodeEnv === 'development',
  cors: false, // Already handled by our CORS middleware
  maskedErrors: appConfig.server.nodeEnv === 'production',
  logging: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
});

// Apply GraphQL middleware
app.use(appConfig.graphql.endpoint, yoga);

// API route for basic info
app.get('/api/info', (req, res) => {
  res.json({
    service: appConfig.serviceMesh.serviceName,
    version: appConfig.serviceMesh.serviceVersion,
    environment: appConfig.server.nodeEnv,
    graphql: {
      endpoint: appConfig.graphql.endpoint,
      playground: appConfig.graphql.playground && appConfig.server.nodeEnv === 'development',
    },
    assets: {
      mode: appConfig.assets.mode,
      ...(appConfig.assets.mode === 'production' ? { cdnUrl: appConfig.assets.cdnUrl } : {}),
    },
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    app.listen(appConfig.server.port, appConfig.server.host, () => {
      console.log(`🚀 Server ready at http://${appConfig.server.host}:${appConfig.server.port}`);
      console.log(`📊 GraphQL endpoint: http://${appConfig.server.host}:${appConfig.server.port}${appConfig.graphql.endpoint}`);
      
      if (appConfig.graphql.playground && appConfig.server.nodeEnv === 'development') {
        console.log(`🎮 GraphQL Playground: http://${appConfig.server.host}:${appConfig.server.port}${appConfig.graphql.endpoint}`);
      }
      
      console.log(`💓 Health check: http://${appConfig.server.host}:${appConfig.server.port}${appConfig.healthCheck.healthPath}`);
      console.log(`✅ Readiness check: http://${appConfig.server.host}:${appConfig.server.port}${appConfig.healthCheck.readinessPath}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal, shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();