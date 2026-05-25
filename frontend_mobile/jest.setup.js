// Default 5s timeout is too tight for the full suite under CI load
// (React Native renders + many setupFiles inflate per-test cost).
jest.setTimeout(30000);

// Provide the native gesture-handler mock so GestureHandlerRootView doesn't throw
// "install is not a function" in the Jest/jsdom environment.
require('react-native-gesture-handler/jestSetup');

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

// Mock expo-router — persistent named fns so tests can spy without re-mocking
const _routerBack = jest.fn();
const _routerPush = jest.fn();
const _routerReplace = jest.fn();
global.__mockRouterBack = _routerBack;
global.__mockRouterPush = _routerPush;
global.__mockRouterReplace = _routerReplace;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: global.__mockRouterBack,
    push: global.__mockRouterPush,
    replace: global.__mockRouterReplace,
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn((cb) => { require('react').useEffect(cb, []); }),
  Link: 'Link',
}));

// Mock onboarding service — persistent named fns so tests can control behavior
const _onboardingHasSeen = jest.fn(() => Promise.resolve(true));
const _onboardingSetSeen = jest.fn(() => Promise.resolve());
const _onboardingReset = jest.fn(() => Promise.resolve());
global.__mockOnboardingHasSeen = _onboardingHasSeen;
global.__mockOnboardingSetSeen = _onboardingSetSeen;
global.__mockOnboardingReset = _onboardingReset;

jest.mock('@/services/local/onboarding.service', () => ({
  __esModule: true,
  default: {
    hasSeenOnboarding: (...args) => global.__mockOnboardingHasSeen(...args),
    setHasSeenOnboarding: (...args) => global.__mockOnboardingSetSeen(...args),
    resetOnboarding: (...args) => global.__mockOnboardingReset(...args),
  },
}));

// Mock expo-localization (used by I18nProvider for device detection)
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'fr', regionCode: 'FR' }],
}));

// i18n mock — resolves keys against the static FR resources so existing
// test assertions on French strings keep passing without modification.
// Supports dot-notation keys, {{var}} interpolation, and {one,other} plural objects.
const resolveFr = (key) => {
  if (typeof key !== 'string') return undefined;
  const fr = require('./i18n/locales/fr/_all').default;
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), fr);
};

const interpolate = (template, options) => {
  if (typeof template !== 'string' || !options) return template;
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, name) =>
      options[name] !== undefined && options[name] !== null ? String(options[name]) : '',
    )
    .replace(/%\{(\w+)\}/g, (_, name) =>
      options[name] !== undefined && options[name] !== null ? String(options[name]) : '',
    );
};

const translate = (key, options) => {
  if (typeof key !== 'string') return '';
  const value = resolveFr(key);
  if (value && typeof value === 'object' && options && typeof options.count === 'number') {
    const form = options.count === 1 ? value.one : value.other;
    return interpolate(form, options) ?? key;
  }
  if (typeof value === 'string') {
    return interpolate(value, options);
  }
  return key;
};

// Mock the I18nContext hook so components calling useTranslation() get FR strings.
jest.mock('@/context/I18nContext', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: translate,
    language: 'fr',
    setLanguage: jest.fn(() => Promise.resolve()),
    ready: true,
  }),
  I18nProvider: ({ children }) => children,
  SUPPORTED_LANGUAGES: ['fr', 'en'],
}));

// Mock the i18n-js singleton for non-React callers (hooks, services, ErrorBoundary).
jest.mock('@/i18n', () => ({
  __esModule: true,
  default: {
    t: translate,
    locale: 'fr',
    defaultLocale: 'fr',
    enableFallback: true,
  },
  isSupportedLanguage: (v) => v === 'fr' || v === 'en',
  SUPPORTED_LANGUAGES: ['fr', 'en'],
}));
