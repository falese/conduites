import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config/index.js';

// CORS middleware for cross-origin requests
export const corsHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = appConfig.cors.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (appConfig.cors.credentials) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers for production
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

// Service mesh headers middleware for distributed tracing
export const serviceMeshHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add service identification headers
  res.header('X-Service-Name', appConfig.serviceMesh.serviceName);
  res.header('X-Service-Version', appConfig.serviceMesh.serviceVersion);
  
  // Forward tracing headers if present
  const traceHeaders = ['x-request-id', 'x-trace-id', 'x-span-id', 'x-b3-traceid', 'x-b3-spanid'];
  
  traceHeaders.forEach(header => {
    const value = req.get(header);
    if (value) {
      res.header(header, value);
    }
  });
  
  next();
};