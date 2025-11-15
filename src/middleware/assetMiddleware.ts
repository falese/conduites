import express from 'express';
import { config } from '../config/environment.js';

/**
 * Asset middleware for serving static assets
 * In development: serves files from ./public directory
 * In production: returns 404 since assets should be served from CDN
 */
export const assetMiddleware: express.RequestHandler = (req, res, next) => {
  // Only handle /assets routes
  if (!req.path.startsWith('/assets')) {
    return next();
  }

  if (config.assets.cdnEnabled) {
    // Production: Assets should be served from CDN, not this server
    return res.status(404).json({
      error: 'Assets not served locally',
      message: 'Static assets are served from CDN in production mode',
      cdnBaseUrl: config.assets.baseUrl,
      requestedPath: req.path,
    });
  }

  // Development: Serve static files from ./public directory
  const staticHandler = express.static('./public', {
    // Disable caching for development
    setHeaders: (res, path, stat) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // No caching in development for easier debugging
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },
  });

  // Remove /assets prefix and serve from public
  req.url = req.url.replace('/assets', '');
  staticHandler(req, res, next);
};