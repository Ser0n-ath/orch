import { useAppStore } from '@/store/useAppStore';

// Helper to get a fresh store instance for each test
const getStoreApi = () => useAppStore.getState();

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.getState().reset();
  });

  describe('currentQuery', () => {
    it('should set current query', () => {
      const store = getStoreApi();
      const query = 'Test query';
      
      store.setCurrentQuery(query);
      
      expect(useAppStore.getState().currentQuery).toBe(query);
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      const store = getStoreApi();
      
      store.setLoading(true);
      expect(useAppStore.getState().isLoading).toBe(true);
      
      store.setLoading(false);
      expect(useAppStore.getState().isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set and clear errors', () => {
      const store = getStoreApi();
      const errorMessage = 'Test error';
      
      store.setError(errorMessage);
      expect(useAppStore.getState().error).toBe(errorMessage);
      
      store.clearError();
      expect(useAppStore.getState().error).toBe(null);
    });
  });

  describe('history management', () => {
    it('should add items to history', () => {
      const store = getStoreApi();
      const historyItem = {
        query: 'Test query',
        mode: 'text' as const,
        status: 'completed' as const,
      };
      
      store.addToHistory(historyItem);
      
      const state = useAppStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toMatchObject(historyItem);
      expect(state.history[0].id).toBeDefined();
      expect(state.history[0].timestamp).toBeDefined();
    });

    it('should update history items', () => {
      const store = getStoreApi();
      
      // Add an item
      const id = store.addToHistory({
        query: 'Test query',
        mode: 'text',
        status: 'in-progress',
      });
      
      // Update the item
      store.updateHistoryItem(id, { status: 'completed', result: 'Success' });
      
      const state = useAppStore.getState();
      const updatedItem = state.history.find(item => item.id === id);
      expect(updatedItem?.status).toBe('completed');
      expect(updatedItem?.result).toBe('Success');
    });
  });

  describe('progress updates', () => {
    it('should add and clear progress updates', () => {
      const store = getStoreApi();
      const update = {
        step: 'Test step',
        progress: 50,
        status: 'in-progress' as const,
        timestamp: new Date().toISOString(),
      };
      
      store.addProgressUpdate(update);
      expect(useAppStore.getState().progressUpdates).toHaveLength(1);
      expect(useAppStore.getState().progressUpdates[0]).toEqual(update);
      
      store.clearProgressUpdates();
      expect(useAppStore.getState().progressUpdates).toHaveLength(0);
    });
  });

  describe('job ID management', () => {
    it('should set current job ID', () => {
      const store = getStoreApi();
      const jobId = 'test-job-123';
      
      store.setCurrentJobId(jobId);
      expect(useAppStore.getState().currentJobId).toBe(jobId);
      
      store.setCurrentJobId(null);
      expect(useAppStore.getState().currentJobId).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = getStoreApi();
      
      // Modify state
      store.setCurrentQuery('test');
      store.setLoading(true);
      store.setError('error');
      store.addToHistory({
        query: 'Test',
        mode: 'text',
        status: 'completed',
      });
      
      // Reset
      store.reset();
      
      const state = useAppStore.getState();
      expect(state.currentQuery).toBe('');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.history).toHaveLength(0);
      expect(state.progressUpdates).toHaveLength(0);
      expect(state.currentJobId).toBe(null);
    });
  });
});