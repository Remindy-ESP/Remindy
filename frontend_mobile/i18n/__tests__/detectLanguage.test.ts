import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { detectLanguage } from '../detectLanguage';

// Override the global jest.setup.js mock with a jest.fn so each test
// can stage its own return value for getLocales.
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    { languageCode: 'fr', languageTag: 'fr-FR' },
  ]),
  getCalendars: jest.fn(() => []),
}));

describe('i18n/detectLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the AsyncStorage value when present and supported', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('fr');
    await expect(detectLanguage()).resolves.toBe('fr');
  });

  it('falls through to the device locale when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (Localization.getLocales as jest.Mock).mockReturnValueOnce([
      { languageCode: 'fr', languageTag: 'fr-FR' },
    ]);
    await expect(detectLanguage()).resolves.toBe('fr');
  });

  it('iterates the preferred locales list and picks the first supported entry', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (Localization.getLocales as jest.Mock).mockReturnValueOnce([
      { languageCode: 'es' },
      { languageCode: 'en' },
    ]);
    await expect(detectLanguage()).resolves.toBe('en');
  });

  it('falls back to FALLBACK_LANGUAGE when nothing matches', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (Localization.getLocales as jest.Mock).mockReturnValueOnce([
      { languageCode: 'es' },
      { languageCode: 'de' },
    ]);
    await expect(detectLanguage()).resolves.toBe('en');
  });

  it('falls back when getLocales throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (Localization.getLocales as jest.Mock).mockImplementationOnce(() => {
      throw new Error('platform module not ready');
    });
    await expect(detectLanguage()).resolves.toBe('en');
  });

  it('falls back when getLocales returns an empty array', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (Localization.getLocales as jest.Mock).mockReturnValueOnce([]);
    await expect(detectLanguage()).resolves.toBe('en');
  });
});
