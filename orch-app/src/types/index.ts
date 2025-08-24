// API Types
export interface QueryRequest {
  query: string;
  mode: 'voice' | 'text';
}

export interface QueryResponse {
  status: 'started' | 'completed' | 'error';
  jobId: string;
  message?: string;
  result?: any;
}

export interface ProgressUpdate {
  step: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'error';
  result?: any;
  timestamp: string;
}

// App State Types
export interface QueryHistory {
  id: string;
  query: string;
  mode: 'voice' | 'text';
  timestamp: string;
  status: 'completed' | 'error' | 'in-progress';
  result?: any;
  jobId?: string;
}

export interface AppState {
  currentQuery: string;
  currentJobId: string | null;
  isLoading: boolean;
  history: QueryHistory[];
  progressUpdates: ProgressUpdate[];
  error: string | null;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  Result: { jobId: string; query: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};