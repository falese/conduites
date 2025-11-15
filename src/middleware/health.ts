import { Request, Response } from 'express';
import { appConfig } from '../config/index.js';

// Health check endpoint for Kubernetes liveness probe
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: appConfig.serviceMesh.serviceName,
    version: appConfig.serviceMesh.serviceVersion,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

// Readiness check endpoint for Kubernetes readiness probe
export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Add checks for downstream services if needed
    // For now, just check if the process is ready
    
    res.status(200).json({
      status: 'ready',
      service: appConfig.serviceMesh.serviceName,
      version: appConfig.serviceMesh.serviceVersion,
      timestamp: new Date().toISOString(),
      checks: {
        process: 'ok',
        // Add more health checks here as needed
        // database: 'ok',
        // externalServices: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: appConfig.serviceMesh.serviceName,
      version: appConfig.serviceMesh.serviceVersion,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};