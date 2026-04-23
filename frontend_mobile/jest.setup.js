// Mock axios globally to prevent its fetch adapter from conflicting with
// expo's ReadableStream polyfill in the Jest/jsdom environment.
// All service-level tests mock their own dependencies (apiClient) explicitly.
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { baseURL: '', headers: { common: {} } },
  };

  const axios = {
    create: jest.fn(() => mockInstance),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { baseURL: '', headers: { common: {} } },
  };

  return { ...axios, default: axios, __esModule: true };
});

// Suppress specific console errors in tests
const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress act() warnings from @expo/vector-icons
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to Icon inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock expo-font to avoid font loading warnings
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

// Mock expo-asset to avoid asset loading warnings
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  };

  return {
    __esModule: true,
    ...mockStorage,
    default: mockStorage,
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));
