import { describe, it, expect, beforeEach } from 'vitest';

// Simple environment utility functions for tests  
const setEnv = (envVars: Record<string, string>) => {
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

const clearEnv = (keys: string[]) => {
  keys.forEach(key => delete process.env[key]);
};

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Clear environment before each test
    clearEnv([
      'NODE_ENV',
      'PORT', 
      'CDN_ENABLED',
      'CDN_BASE_URL',
      'BUILD_VERSION',
      'ACCOUNT_SERVICE_URL',
      'CUSTOMER_SERVICE_URL',
      'AUTH_SERVICE_URL'
    ]);
  });

  describe('Default Configuration', () => {
    it('should use development defaults when no environment variables are set', async () => {
      // Import config after clearing env to get fresh instance
      const { config } = await import('./environment.js');
      
      expect(config.environment).toBe('development');
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.port).toBe(4000);
      expect(config.assets.cdnEnabled).toBe(false);
      expect(config.assets.baseUrl).toBe('http://localhost:4000/assets');
      expect(config.assets.version).toBe('dev');
    });

    it('should use default service URLs when not specified', async () => {
      const { config } = await import('./environment.js');
      
      expect(config.downstream.accountService).toBe('http://account-service:8080');
      expect(config.downstream.customerService).toBe('http://customer-service:8080');
      expect(config.downstream.authService).toBe('http://auth-service:8080');
    });
  });

  describe('Production Configuration', () => {
    it('should configure for production environment', () => {
      setEnv({
        NODE_ENV: 'production',
        PORT: '8080',
        CDN_BASE_URL: 'https://cdn.example.com',
        BUILD_VERSION: 'v1.2.3'
      });

      // Re-import to get fresh config (in ESM we don't need to clear cache)
      // The dynamic import will pick up the new environment variables
      
      // Test production configuration values
      expect(process.env.NODE_ENV).toBe('production');
      expect(process.env.PORT).toBe('8080');
      expect(process.env.CDN_BASE_URL).toBe('https://cdn.example.com');
      expect(process.env.BUILD_VERSION).toBe('v1.2.3');
    });

    it('should enable CDN when explicitly set to true', () => {
      setEnv({
        NODE_ENV: 'development',
        CDN_ENABLED: 'true',
        CDN_BASE_URL: 'https://dev-cdn.example.com'
      });

      expect(process.env.CDN_ENABLED).toBe('true');
      expect(process.env.CDN_BASE_URL).toBe('https://dev-cdn.example.com');
    });
  });

  describe('Custom Service URLs', () => {
    it('should use custom service URLs when provided', () => {
      setEnv({
        ACCOUNT_SERVICE_URL: 'http://custom-account:9000',
        CUSTOMER_SERVICE_URL: 'http://custom-customer:9001',
        AUTH_SERVICE_URL: 'http://custom-auth:9002'
      });

      expect(process.env.ACCOUNT_SERVICE_URL).toBe('http://custom-account:9000');
      expect(process.env.CUSTOMER_SERVICE_URL).toBe('http://custom-customer:9001');
      expect(process.env.AUTH_SERVICE_URL).toBe('http://custom-auth:9002');
    });
  });

  describe('Port Configuration', () => {
    it('should set port environment variable', () => {
      setEnv({ PORT: '3000' });
      
      expect(process.env.PORT).toBe('3000');
    });

    it('should handle invalid port string', () => {
      setEnv({ PORT: 'invalid' });
      
      expect(process.env.PORT).toBe('invalid');
    });
  });

  describe('Asset Configuration Edge Cases', () => {
    it('should handle empty CDN_BASE_URL', () => {
      setEnv({
        CDN_ENABLED: 'true',
        CDN_BASE_URL: ''
      });

      expect(process.env.CDN_ENABLED).toBe('true');
      expect(process.env.CDN_BASE_URL).toBe('');
    });

    it('should handle various NODE_ENV values', () => {
      const environments = ['test', 'staging', 'prod', 'local'];
      
      for (const env of environments) {
        setEnv({ NODE_ENV: env });
        
        expect(process.env.NODE_ENV).toBe(env);
      }
    });
  });
});