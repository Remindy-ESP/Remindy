// Default 5s timeout is too tight for the full suite under CI load
// (React Native renders + many setupFiles inflate per-test cost).
jest.setTimeout(30000);

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

// Mock expo-localization to return French as the device locale.
// Existing tests assert on French UI strings — without this the i18n
// fallback chain resolves to English (FALLBACK_LANGUAGE) and every
// test that asserts on French copy would break. Tests covering EN/FR
// switching explicitly override this mock per-test.
jest.mock('expo-localization', () => ({
  getLocales: () => [
    {
      languageCode: 'fr',
      languageTag: 'fr-FR',
      regionCode: 'FR',
      textDirection: 'ltr',
      measurementSystem: 'metric',
      currencyCode: 'EUR',
      currencySymbol: '€',
      decimalSeparator: ',',
      digitGroupingSeparator: ' ',
      temperatureUnit: 'celsius',
    },
  ],
  getCalendars: () => [],
}));

// Ensure i18n has resolved to its detected language before any test
// renders. detectLanguage is async (AsyncStorage read) so without this
// the first paint of a test would briefly show fallback English.
beforeAll(async () => {
  // require lazily so the mocks above are wired before i18n initializes
  const i18nModule = require('./i18n');
  await i18nModule.initI18n();
});
