import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, QueryHistory, ProgressUpdate } from '@/types';

interface AppStore extends AppState {
  // Actions
  setCurrentQuery: (query: string) => void;
  setCurrentJobId: (jobId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (item: Omit<QueryHistory, 'id' | 'timestamp'>) => void;
  updateHistoryItem: (id: string, updates: Partial<QueryHistory>) => void;
  updateHistoryStatus: (jobId: string, status: 'completed' | 'error' | 'in-progress') => void;
  addProgressUpdate: (update: ProgressUpdate) => void;
  clearProgressUpdates: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: AppState = {
  currentQuery: '',
  currentJobId: null,
  isLoading: false,
  history: [],
  progressUpdates: [],
  error: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentQuery: (query: string) => 
        set({ currentQuery: query }),

      setCurrentJobId: (jobId: string | null) => 
        set({ currentJobId: jobId }),

      setLoading: (loading: boolean) => 
        set({ isLoading: loading }),

      setError: (error: string | null) => 
        set({ error }),

      addToHistory: (item) => {
        const newItem: QueryHistory = {
          ...item,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          history: [newItem, ...state.history],
        }));
        return newItem.id;
      },

      updateHistoryItem: (id: string, updates: Partial<QueryHistory>) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      updateHistoryStatus: (jobId: string, status: 'completed' | 'error' | 'in-progress') =>
        set((state) => ({
          history: state.history.map((item) =>
            item.jobId === jobId ? { ...item, status } : item
          ),
        })),

      addProgressUpdate: (update: ProgressUpdate) =>
        set((state) => ({
          progressUpdates: [...state.progressUpdates, update],
        })),

      clearProgressUpdates: () => 
        set({ progressUpdates: [] }),

      clearError: () => 
        set({ error: null }),

      reset: () => 
        set(initialState),
    }),
    {
      name: 'orchestra-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist history, not transient state
      partialize: (state) => ({ 
        history: state.history 
      }),
    }
  )
);