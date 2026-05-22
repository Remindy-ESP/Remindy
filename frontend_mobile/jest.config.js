module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-calendars)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    'i18n/**/*.{ts,tsx}',
    'components/settings/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/index.ts',
    '!i18n/resources.ts',
    '!i18n/react-i18next.d.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};
