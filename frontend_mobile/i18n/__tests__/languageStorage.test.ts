import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearStoredLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from '../languageStorage';
import { LANGUAGE_STORAGE_KEY } from '../config';

describe('i18n/languageStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStoredLanguage', () => {
    it('returns a stored, supported language', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('fr');
      await expect(getStoredLanguage()).resolves.toBe('fr');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
    });

    it('returns null when the stored value is unsupported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('es');
      await expect(getStoredLanguage()).resolves.toBeNull();
    });

    it('returns null when nothing is stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      await expect(getStoredLanguage()).resolves.toBeNull();
    });

    it('returns null when AsyncStorage throws', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      await expect(getStoredLanguage()).resolves.toBeNull();
    });
  });

  describe('setStoredLanguage', () => {
    it('writes the language under the canonical key', async () => {
      await setStoredLanguage('fr');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'fr');
    });
  });

  describe('clearStoredLanguage', () => {
    it('removes the language entry', async () => {
      await clearStoredLanguage();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
    });
  });
});
