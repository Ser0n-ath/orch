// API Configuration for BatonCore Server
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://your-production-server.com',
  TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
  ENDPOINTS: {
    QUERY: '/api/execute',     // BatonCore endpoint for automation
    STATUS: '/api/status',     // We'll need to create this or use health
    RESULT: '/api/result',     // We'll need to create this
    HISTORY: '/api/history',   // We'll need to create this
    HEALTH: '/health',         // BatonCore health endpoint
  },
};

// For now, these return null since your server doesn't seem to require auth
export const getApiKey = (): string | null => {
  // Return your API key if needed
  return null;
};

export const getAuthToken = (): string | null => {
  // Return your auth token if needed
  return null;
};