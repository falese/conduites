import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config/index.js';

// Request logging middleware for observability
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Log request
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Incoming request',
    method,
    url,
    ip,
    userAgent,
    service: appConfig.serviceMesh.serviceName,
    version: appConfig.serviceMesh.serviceVersion,
  }));

  // Capture response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Request completed',
      method,
      url,
      statusCode: res.statusCode,
      duration,
      service: appConfig.serviceMesh.serviceName,
    }));
  });

  next();
};