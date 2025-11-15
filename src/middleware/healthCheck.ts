import express from 'express';
import { schema } from '../schema/index.js';

/**
 * Health check middleware for OpenShift/Kubernetes readiness and liveness probes
 * Validates that the service is ready to handle requests
 */
export const healthCheckMiddleware: express.RequestHandler = (req, res) => {
  try {
    // Check that GraphQL schema is loaded and valid
    if (!schema || !schema.getTypeMap || Object.keys(schema.getTypeMap()).length === 0) {
      return res.status(503).json({
        status: 'DOWN',
        service: 'graph-conduit-accounts',
        timestamp: new Date().toISOString(),
        error: 'GraphQL schema not loaded or invalid',
      });
    }

    // Basic schema validation - check for required types
    const typeMap = schema.getTypeMap();
    const hasQuery = typeMap.Query;
    
    if (!hasQuery) {
      return res.status(503).json({
        status: 'DOWN',
        service: 'graph-conduit-accounts',
        timestamp: new Date().toISOString(),
        error: 'GraphQL Query type not found in schema',
      });
    }

    // Service is healthy
    res.status(200).json({
      status: 'UP',
      service: 'graph-conduit-accounts',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Catch any unexpected errors during health check
    res.status(503).json({
      status: 'DOWN',
      service: 'graph-conduit-accounts',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error',
    });
  }
};