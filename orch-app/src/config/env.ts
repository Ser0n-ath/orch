// Environment Configuration
// You can create a .env file in your project root to override these values

export const ENV = {
  // API Configuration
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  API_KEY: process.env.API_KEY || '',
  AUTH_TOKEN: process.env.AUTH_TOKEN || '',
  
  // App Configuration
  APP_NAME: 'Orchestra',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_LOGGING: __DEV__,
  ENABLE_ANALYTICS: !__DEV__,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000,
  POLLING_INTERVAL: 2000,
  MAX_POLLING_TIME: 300000, // 5 minutes
};

// Helper function to get environment-specific values
export const getEnvValue = (key: keyof typeof ENV): string => {
  return ENV[key] || '';
};

// Check if we're in development mode
export const isDevelopment = __DEV__;

// Check if we're in production mode
export const isProduction = !__DEV__;
