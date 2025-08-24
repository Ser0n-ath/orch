import { useState, useCallback } from 'react';
import { orchestraApi, JobStatus, QueryResult } from '@/services/orchestraApi';
import { QueryRequest } from '@/types';

interface UseOrchestraApiReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  submitQuery: (request: QueryRequest) => Promise<string | null>;
  getJobStatus: (jobId: string) => Promise<JobStatus | null>;
  getJobResult: (jobId: string) => Promise<any>;
  cancelJob: (jobId: string) => Promise<boolean>;
  submitQueryAndWait: (
    request: QueryRequest,
    onProgress?: (status: JobStatus) => void,
    timeoutMs?: number
  ) => Promise<QueryResult | null>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}

export const useOrchestraApi = (): UseOrchestraApiReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const submitQuery = useCallback(async (request: QueryRequest): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await orchestraApi.submitQuery(request);
      return response.jobId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit query';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getJobStatus = useCallback(async (jobId: string): Promise<JobStatus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await orchestraApi.getJobStatus(jobId);
      return status;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get job status';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getJobResult = useCallback(async (jobId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await orchestraApi.getJobResult(jobId);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get job result';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await orchestraApi.cancelJob(jobId);
      return success;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to cancel job';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitQueryAndWait = useCallback(async (
    request: QueryRequest,
    onProgress?: (status: JobStatus) => void,
    timeoutMs?: number
  ): Promise<QueryResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await orchestraApi.submitQueryAndWait(request, onProgress, timeoutMs);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit query and wait';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Actions
    submitQuery,
    getJobStatus,
    getJobResult,
    cancelJob,
    submitQueryAndWait,
    
    // Utilities
    clearError,
    reset,
  };
};
