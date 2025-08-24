# Orchestra API Integration Guide

This document explains how to use the new API integration system in your Orchestra mobile app.

## Overview

The app now includes a complete API integration system that replaces the previous demo/simulation functionality. It includes:

- **API Client**: Axios-based HTTP client with interceptors and error handling
- **Orchestra API Service**: Service layer for all Orchestra-specific API calls
- **React Hook**: `useOrchestraApi` hook for easy integration in components
- **Configuration**: Environment-based configuration management

## Quick Start

### 1. Configure Your API Endpoint

Edit `src/config/api.ts` and update the `BASE_URL`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://your-dev-api.com/api'  // Development
    : 'https://your-production-api.com/api', // Production
  // ... other config
};
```

### 2. Set Environment Variables (Optional)

Create a `.env` file in your project root:

```bash
API_BASE_URL=https://your-api.com/api
API_KEY=your_api_key_here
AUTH_TOKEN=your_auth_token_here
```

### 3. Use the API in Components

```typescript
import { useOrchestraApi } from '@/hooks/useOrchestraApi';

function MyComponent() {
  const { submitQuery, isLoading, error, clearError } = useOrchestraApi();
  
  const handleSubmit = async () => {
    const jobId = await submitQuery({
      query: "Your question here",
      mode: "text"
    });
    
    if (jobId) {
      // Navigate to result screen or handle success
    }
  };
  
  return (
    // Your component JSX
  );
}
```

## API Endpoints

The system expects these API endpoints:

- `POST /api/query` - Submit a new query
- `GET /api/status/{jobId}` - Get job status
- `GET /api/result/{jobId}` - Get job result
- `GET /api/history` - Get query history
- `DELETE /api/status/{jobId}` - Cancel a job

## Expected API Response Format

All API responses should follow this format:

```typescript
interface OrchestraApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Query Response

```typescript
interface QueryResponse {
  status: 'started' | 'completed' | 'error';
  jobId: string;
  message?: string;
}
```

### Job Status Response

```typescript
interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}
```

## Features

### Automatic Retry Logic
- Retries failed requests up to 3 times
- Exponential backoff for retry delays
- Only retries on network errors or 5xx server errors

### Error Handling
- Comprehensive error messages for different HTTP status codes
- User-friendly error display in the UI
- Automatic error clearing

### Progress Tracking
- Real-time job status updates
- Progress bar visualization
- Automatic navigation to results when complete

### Authentication
- Support for API keys via `X-API-Key` header
- Support for Bearer tokens via `Authorization` header
- Configurable authentication methods

## Usage Examples

### Submit a Query and Wait for Completion

```typescript
const { submitQueryAndWait } = useOrchestraApi();

const result = await submitQueryAndWait(
  { query: "What is the weather?", mode: "text" },
  (status) => {
    // Progress callback
    console.log(`Progress: ${status.progress}%`);
  },
  300000 // 5 minute timeout
);
```

### Poll Job Status Manually

```typescript
const { getJobStatus } = useOrchestraApi();

const status = await getJobStatus(jobId);
if (status?.status === 'completed') {
  // Handle completion
}
```

### Cancel a Running Job

```typescript
const { cancelJob } = useOrchestraApi();

const success = await cancelJob(jobId);
if (success) {
  // Job cancelled successfully
}
```

## Error Handling

The system automatically handles common HTTP errors:

- **400**: Bad request - Invalid input data
- **401**: Unauthorized - Check credentials
- **403**: Forbidden - Insufficient permissions
- **404**: Not found - Resource doesn't exist
- **429**: Too many requests - Rate limiting
- **500**: Internal server error - Server issue

## Configuration Options

### API Client Configuration

```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://your-api.com/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
```

### Environment Variables

```typescript
// src/config/env.ts
export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  API_KEY: process.env.API_KEY || '',
  AUTH_TOKEN: process.env.AUTH_TOKEN || '',
  REQUEST_TIMEOUT: 30000,
  POLLING_INTERVAL: 2000,
  MAX_POLLING_TIME: 300000,
};
```

## Testing

### Mock API for Development

For development without a real API, you can:

1. Use a mock service like [json-server](https://github.com/typicode/json-server)
2. Create a simple Express.js server with the expected endpoints
3. Use tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to test endpoints

### Example Mock Server

```javascript
// mock-server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/query', (req, res) => {
  const jobId = `job-${Date.now()}`;
  res.json({
    success: true,
    data: {
      status: 'started',
      jobId,
      message: 'Query submitted successfully'
    }
  });
});

app.get('/api/status/:jobId', (req, res) => {
  res.json({
    success: true,
    data: {
      jobId: req.params.jobId,
      status: 'completed',
      progress: 100,
      message: 'Processing complete'
    }
  });
});

app.listen(3000, () => {
  console.log('Mock server running on port 3000');
});
```

## Troubleshooting

### Common Issues

1. **Network Error**: Check your API endpoint and internet connection
2. **401 Unauthorized**: Verify your API key or auth token
3. **404 Not Found**: Check that your API endpoints match the expected paths
4. **Timeout**: Increase the `TIMEOUT` value in the configuration

### Debug Mode

Enable debug logging by checking the console:

```typescript
// The API client automatically logs:
// - Request/response times
// - Retry attempts
// - Error details
```

### Testing API Connectivity

```typescript
// Test basic connectivity
const { getJobStatus } = useOrchestraApi();

try {
  const status = await getJobStatus('test-job-id');
  console.log('API connection successful');
} catch (error) {
  console.error('API connection failed:', error.message);
}
```

## Migration from Demo Mode

If you're migrating from the previous demo/simulation mode:

1. **Replace demo calls**: Update `handleSubmit` functions to use `submitQuery`
2. **Update progress handling**: Replace simulated progress with real API polling
3. **Handle real errors**: Replace demo error handling with API error handling
4. **Test thoroughly**: Verify all API endpoints work as expected

## Support

For issues or questions:

1. Check the console for error messages
2. Verify your API endpoint configuration
3. Test API endpoints independently (e.g., with Postman)
4. Check network connectivity and authentication

## Future Enhancements

Potential improvements for the API integration:

- **WebSocket support** for real-time updates
- **Offline mode** with request queuing
- **Request caching** for better performance
- **Rate limiting** on the client side
- **Request/response logging** for debugging
- **Metrics collection** for monitoring
