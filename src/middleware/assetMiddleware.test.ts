import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import type { MockedFunction } from 'vitest';

// Mock the config with default values
vi.mock('../config/environment.js', () => ({
  config: {
    assets: {
      cdnEnabled: false,
      baseUrl: 'http://localhost:4000/assets',
    },
  },
}));

describe('Asset Middleware', () => {
  let mockRequest: any; // Use any to allow property modification
  let mockResponse: Partial<Response>;
  let mockNext: any; // Use any to avoid NextFunction type conflicts

  beforeEach(() => {
    mockRequest = {
      path: '/assets/test.js',
      url: '/assets/test.js',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('Non-asset requests', () => {
    it('should call next() for non-asset paths', async () => {
      mockRequest.path = '/api/test';
      
      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next() for root path', async () => {
      mockRequest.path = '/';
      
      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('CDN Enabled Mode', () => {
    beforeEach(() => {
      // Mock config with CDN enabled
      vi.doMock('../config/environment.js', () => ({
        config: {
          assets: {
            cdnEnabled: true,
            baseUrl: 'https://cdn.example.com',
          },
        },
      }));
    });

    it('should return 404 with helpful message when CDN is enabled', async () => {
      vi.resetModules();
      const { assetMiddleware } = await import('./assetMiddleware.js');

      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Assets not served locally',
        message: 'Static assets are served from CDN in production mode',
        cdnBaseUrl: 'https://cdn.example.com',
        requestedPath: '/assets/test.js',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('CDN Disabled Mode', () => {
    beforeEach(() => {
      // Mock config with CDN disabled
      vi.doMock('../config/environment.js', () => ({
        config: {
          assets: {
            cdnEnabled: false,
            baseUrl: 'http://localhost:4000/assets',
          },
        },
      }));

      // Mock express.static to simulate file not found scenario
      vi.doMock('express', () => ({
        default: {
          static: vi.fn(() => {
            return (req: Request, res: Response, next: NextFunction) => {
              // Simulate file not found, so static handler calls next()
              next();
            };
          }),
        },
      }));
    });

    it('should delegate to express.static when CDN is disabled', async () => {
      vi.resetModules();
      const { assetMiddleware } = await import('./assetMiddleware.js');

      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Since file doesn't exist in test environment, express.static calls next()
      expect(mockNext).toHaveBeenCalled();
    });

    it('should strip /assets prefix from URL', async () => {
      vi.resetModules();
      
      // Mock express.static to verify URL transformation
      const mockStatic = vi.fn(() => {
        return (req: Request, res: Response, next: NextFunction) => {
          // Verify the URL has been modified
          expect(req.url).toBe('/test.js'); // /assets/test.js -> /test.js
          next();
        };
      });

      vi.doMock('express', () => ({
        default: {
          static: mockStatic,
        },
      }));

      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatic).toHaveBeenCalledWith('./public', expect.objectContaining({
        setHeaders: expect.any(Function),
      }));
    });
  });

  describe('Security Headers', () => {
    it('should set security headers in development mode', async () => {
      vi.resetModules();
      
      // Mock express.static to capture setHeaders function
      let capturedSetHeaders: Function | null = null;
      
      vi.doMock('express', () => ({
        default: {
          static: vi.fn((path: string, options: any) => {
            capturedSetHeaders = options.setHeaders;
            return (req: Request, res: Response, next: NextFunction) => {
              next();
            };
          }),
        },
      }));

      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Test the setHeaders function
      expect(capturedSetHeaders).toBeDefined();
      if (capturedSetHeaders) {
        // Type assertion to fix TypeScript error
        (capturedSetHeaders as any)(mockResponse, '/test/path', {});
        
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Expires', '0');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle /assets path exactly', async () => {
      mockRequest.path = '/assets';
      mockRequest.url = '/assets';
      
      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should be treated as an asset request
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle nested asset paths', async () => {
      mockRequest.path = '/assets/js/components/header.js';
      mockRequest.url = '/assets/js/components/header.js';
      
      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should be treated as an asset request
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not handle similar but different paths', async () => {
      mockRequest.path = '/api/assets-config';
      mockRequest.url = '/api/assets-config';
      
      const { assetMiddleware } = await import('./assetMiddleware.js');
      assetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Should call next since it's not an asset request
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });
});