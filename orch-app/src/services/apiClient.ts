import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, getApiKey, getAuthToken } from '@/config/api';

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 0;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication headers
        const apiKey = getApiKey();
        const authToken = getAuthToken();
        
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }
        
        if (authToken) {
          config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Add request timestamp for debugging
        (config as any).metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time for debugging
        if ((response.config as any).metadata?.startTime) {
          const endTime = new Date();
          const duration = endTime.getTime() - (response.config as any).metadata.startTime.getTime();
          console.log(`API Response Time: ${duration}ms`);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Handle retry logic
        if (this.shouldRetry(error) && this.retryCount < API_CONFIG.RETRY.MAX_ATTEMPTS) {
          this.retryCount++;
          
          // Wait before retrying
          await this.delay(API_CONFIG.RETRY.DELAY * this.retryCount);
          
          console.log(`Retrying request (${this.retryCount}/${API_CONFIG.RETRY.MAX_ATTEMPTS})`);
          return this.client(originalRequest);
        }

        // Reset retry count
        this.retryCount = 0;
        
        // Handle specific error cases
        return this.handleError(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: AxiosError): never {
    let errorMessage = 'An unexpected error occurred';

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || 'Bad request';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please check your credentials';
          break;
        case 403:
          errorMessage = 'Forbidden - You don\'t have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 429:
          errorMessage = 'Too many requests - Please try again later';
          break;
        case 500:
          errorMessage = 'Internal server error - Please try again later';
          break;
        default:
          errorMessage = data?.message || `Server error (${status})`;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server - Please check your internet connection';
    } else {
      // Something else happened
      errorMessage = error.message || 'Network error';
    }

    const customError = new Error(errorMessage);
    (customError as any).originalError = error;
    (customError as any).status = error.response?.status;
    
    throw customError;
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// BatonCore API Methods
export class BatonCoreAPI {
  // Execute automation task
  static async executeTask(prompt: string): Promise<any> {
    try {
      console.log('Submitting automation request:', prompt);
      const response = await apiClient.post('/api/execute', { prompt });
      console.log('Automation response:', response);
      return response;
    } catch (error) {
      console.error('Failed to execute automation task:', error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 'ok' || response === 'OK' || true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get server status
  static async getStatus(): Promise<any> {
    try {
      return await apiClient.get('/health');
    } catch (error) {
      console.error('Failed to get server status:', error);
      throw error;
    }
  }
}

export default apiClient;
