import '@testing-library/jest-native/extend-expect';

// Mock React Native Voice
jest.mock('@react-native-voice/voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechRecognized: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
  removeAllListeners: jest.fn(),
}));

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    popToTop: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  NavigationContainer: jest.fn(({ children }) => children),
}));

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: jest.fn(({ children }) => children),
}));

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: jest.fn(({ children }) => children),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};