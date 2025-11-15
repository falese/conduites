interface AssetConfig {
  cdnEnabled: boolean;    // Whether to use CDN for static assets
  baseUrl: string;        // Base URL for CDN or local assets
  version: string;        // Build version for cache busting
}

interface Config {
  environment: string;    // Current environment (development, production, test)
  isDevelopment: boolean; // Helper flag for development environment
  isProduction: boolean;  // Helper flag for production environment
  port: number;          // Server port number
  assets: AssetConfig;   // Asset serving configuration
  downstream: {
    accountService: string;   // Account microservice URL
    customerService: string;  // Customer microservice URL
    authService: string;      // Authentication service URL
  };
}

/**
 * Application configuration loaded from environment variables
 * Provides typed access to all configuration values with sensible defaults
 */
export const config: Config = {
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Server configuration
  port: parseInt(process.env.PORT || '4000', 10),
  
  // Asset serving configuration
  assets: {
    // Enable CDN in production or when explicitly enabled
    cdnEnabled: process.env.CDN_ENABLED === 'true' || process.env.NODE_ENV === 'production',
    
    // CDN base URL or fallback to local development URL
    baseUrl: process.env.CDN_BASE_URL || 'http://localhost:4000/assets',
    
    // Build version for cache busting (git commit, build number, etc.)
    version: process.env.BUILD_VERSION || 'dev',
  },
  
  // Downstream service URLs
  downstream: {
    // Account service for user account operations
    accountService: process.env.ACCOUNT_SERVICE_URL || 'http://account-service:8080',
    
    // Customer service for customer data operations
    customerService: process.env.CUSTOMER_SERVICE_URL || 'http://customer-service:8080',
    
    // Authentication service for auth operations
    authService: process.env.AUTH_SERVICE_URL || 'http://auth-service:8080',
  },
};