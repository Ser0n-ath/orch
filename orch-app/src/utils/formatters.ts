/**
 * Utility functions for formatting data throughout the app
 */

export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export const formatAbsoluteTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString();
};

export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  })}`;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatJobId = (jobId: string): string => {
  // Display first 8 characters of job ID for readability
  return jobId.slice(0, 8);
};

export const formatProgressPercentage = (progress: number): string => {
  return `${Math.round(Math.max(0, Math.min(100, progress)))}%`;
};

export const formatApiError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};