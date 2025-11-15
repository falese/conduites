import express from 'express';
import { createYoga } from 'graphql-yoga';
import cluster from 'cluster';
import { cpus } from 'os';
import { randomUUID } from 'crypto';
import { config } from './config/environment.js';
import { schema } from './schema/index.js';
import { assetMiddleware } from './middleware/assetMiddleware.js';
import type { AssetConfig } from './config/environment.js';

/**
 * Generate HTML document with proper asset loading based on configuration
 * @param assetConfig - Asset configuration for CDN vs local assets
 * @returns Complete HTML document as string
 */
function generateIndexHtml(assetConfig: AssetConfig): string {
  const cssUrl = assetConfig.cdnEnabled 
    ? `${assetConfig.baseUrl}/${assetConfig.version}/mfe-accounts.css`
    : '/assets/mfe-accounts.css';
    
  const jsUrl = assetConfig.cdnEnabled 
    ? `${assetConfig.baseUrl}/${assetConfig.version}/mfe-accounts.js`
    : '/assets/mfe-accounts.js';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Conduit Accounts</title>
    <link rel="stylesheet" href="${cssUrl}">
    <script>
        window.ASSET_CONFIG = ${JSON.stringify(assetConfig)};
    </script>
</head>
<body>
    <div id="root"></div>
    <script src="${jsUrl}"></script>
</body>
</html>`;
}

/**
 * Health check endpoints for Kubernetes liveness/readiness probes
 */
function setupHealthChecks(app: express.Application) {
  const healthResponse = {
    status: 'healthy',
    timestamp: () => new Date().toISOString(),
    environment: config.environment,
    version: config.assets.version,
  };

  // Standard health check endpoint
  app.get('/health', (req, res) => {
    res.json({ ...healthResponse, timestamp: healthResponse.timestamp() });
  });

  // Spring Boot Actuator style health endpoint
  app.get('/actuator/health', (req, res) => {
    res.json({ ...healthResponse, timestamp: healthResponse.timestamp() });
  });
}

/**
 * Create and configure the GraphQL Yoga instance
 */
function createGraphQLServer() {
  return createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    
    // Environment-based logging configuration
    logging: config.isDevelopment,
    
    // Disable landing page (this is a thin BFF, not a public GraphQL API)
    landingPage: false,
    
    // Enable GraphiQL only in development
    graphiql: config.isDevelopment,
  });
}

/**
 * Setup SPA fallback - serve index.html or generate HTML based on CDN mode
 */
function setupSpaFallback(app: express.Application) {
  app.get('*', (req, res) => {
    // Skip API routes and assets
    if (req.path.startsWith('/graphql') || 
        req.path.startsWith('/health') || 
        req.path.startsWith('/actuator') ||
        req.path.startsWith('/assets')) {
      return res.status(404).json({ error: 'Not Found' });
    }

    // Generate HTML with proper asset configuration
    const html = generateIndexHtml(config.assets);
    res.send(html);
  });
}

/**
 * Start the Express server with GraphQL Yoga
 * This is a thin BFF - only orchestrates I/O, no business logic
 */
async function startServer(): Promise<void> {
  try {
    const app = express();

    // Trust proxy headers for service mesh/load balancer
    app.set('trust proxy', true);

    // Basic middleware
    app.use(express.json());

    // Health check endpoints (must be first for K8s probes)
    setupHealthChecks(app);

    // Asset serving middleware
    app.use(assetMiddleware);

    // GraphQL endpoint
    const yoga = createGraphQLServer();
    app.use('/graphql', yoga);

    // SPA fallback for micro-frontend routing
    setupSpaFallback(app);

    // Start server
    const server = app.listen(config.port, () => {
      const workerId = cluster.worker?.id || 'master';
      console.log(`🚀 Worker ${workerId}: Server ready at http://localhost:${config.port}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${config.port}/graphql`);
      
      if (config.isDevelopment) {
        console.log(`🎮 GraphiQL: http://localhost:${config.port}/graphql`);
      }
      
      console.log(`💓 Health checks: /health, /actuator/health`);
      console.log(`🏗️  Environment: ${config.environment}`);
      console.log(`📦 CDN enabled: ${config.assets.cdnEnabled}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log(`⏹️  Worker ${cluster.worker?.id || 'master'}: Shutting down gracefully...`);
      server.close(() => {
        console.log(`✅ Worker ${cluster.worker?.id || 'master'}: Server closed`);
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Production clustering - fork workers for each CPU core
 * Development runs single process for easier debugging
 */
if (config.isProduction && cluster.isPrimary) {
  const numCPUs = cpus().length;
  
  console.log(`🏭 Master process ${process.pid} starting ${numCPUs} workers`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker death
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚰️  Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

} else {
  // Development: single process, Production: worker process
  startServer();
}