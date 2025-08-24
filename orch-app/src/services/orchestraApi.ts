import apiClient from './apiClient';
import { API_CONFIG } from '@/config/api';
import { QueryRequest, QueryResponse, ProgressUpdate, QueryHistory } from '@/types';

// In-memory storage for BatonCore results
const resultStorage = new Map<string, any>();

export interface OrchestraApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QueryResult {
  jobId: string;
  status: 'started' | 'completed' | 'error';
  result?: any;
  progress?: number;
  message?: string;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}

class OrchestraApiService {
  /**
   * Submit a new query to the BatonCore API
   */
  async submitQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      console.log('Submitting query to BatonCore:', request);
      
      // BatonCore expects { "prompt": "your automation request" }
      const batonRequest = {
        prompt: request.query
      };
      
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.QUERY,
        batonRequest
      );

      console.log('BatonCore response:', response);

      // BatonCore returns the result directly, so we need to create a job-like response
      // Store the full BatonCore response including the prompt for better display
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the full BatonCore result for later retrieval
      const fullResult = {
        ...response,
        prompt: request.query // Add the original prompt for display
      };
      resultStorage.set(jobId, fullResult);
      
      return {
        jobId,
        status: 'completed',
        message: 'Task completed successfully',
        result: fullResult
      };
    } catch (error) {
      console.error('Submit query error:', error);
      throw error;
    }
  }

  /**
   * Check the status of a job (BatonCore executes immediately, so always completed)
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      // Since BatonCore executes tasks immediately, we'll return completed status
      return {
        jobId,
        status: 'completed',
        progress: 100,
        message: 'Task completed successfully'
      };
    } catch (error) {
      console.error('Get job status error:', error);
      throw error;
    }
  }

  /**
   * Get the final result of a completed job (BatonCore returns results immediately)
   */
  async getJobResult(jobId: string): Promise<any> {
    try {
      // Retrieve the stored BatonCore result
      const storedResult = resultStorage.get(jobId);
      
      if (storedResult) {
        console.log('Retrieved stored result for', jobId, ':', storedResult);
        return storedResult;
      }
      
      // Fallback if no stored result found
      return {
        success: true,
        message: 'Task completed successfully',
        jobId
      };
    } catch (error) {
      console.error('Get job result error:', error);
      throw error;
    }
  }

  /**
   * Get user's query history
   */
  async getQueryHistory(limit?: number, offset?: number): Promise<QueryHistory[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const response = await apiClient.get<OrchestraApiResponse<QueryHistory[]>>(
        `${API_CONFIG.ENDPOINTS.HISTORY}?${params.toString()}`
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to get query history');
      }

      return response.data || [];
    } catch (error) {
      console.error('Get query history error:', error);
      throw error;
    }
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<OrchestraApiResponse<boolean>>(
        `${API_CONFIG.ENDPOINTS.STATUS}/${jobId}`
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel job');
      }

      return response.data || false;
    } catch (error) {
      console.error('Cancel job error:', error);
      throw error;
    }
  }

  /**
   * Poll job status until completion or timeout
   */
  async pollJobStatus(
    jobId: string, 
    onProgress?: (status: JobStatus) => void,
    timeoutMs: number = 300000 // 5 minutes default
  ): Promise<JobStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await this.getJobStatus(jobId);
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(status);
        }

        // Check if job is complete
        if (status.status === 'completed' || status.status === 'failed') {
          return status;
        }

        // Wait before next poll (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(1.5, Math.floor((Date.now() - startTime) / 10000)), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
      } catch (error) {
        console.error('Poll job status error:', error);
        // Continue polling on error, but log it
      }
    }

    throw new Error('Job polling timeout');
  }

  /**
   * Submit query and wait for completion
   */
  async submitQueryAndWait(
    request: QueryRequest,
    onProgress?: (status: JobStatus) => void,
    timeoutMs?: number
  ): Promise<QueryResult> {
    // Submit the query
    const queryResponse = await this.submitQuery(request);
    
    // Poll for completion
    const finalStatus = await this.pollJobStatus(
      queryResponse.jobId,
      onProgress,
      timeoutMs
    );

    // Get the final result if completed
    let result = null;
    if (finalStatus.status === 'completed') {
      result = await this.getJobResult(queryResponse.jobId);
    }

    return {
      jobId: queryResponse.jobId,
      status: finalStatus.status === 'completed' ? 'completed' : 'error',
      result,
      progress: finalStatus.progress,
      message: finalStatus.message,
    };
  }
}

// Export singleton instance
export const orchestraApi = new OrchestraApiService();
export default orchestraApi;
