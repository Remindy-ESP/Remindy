import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  LANGUAGE_LABELS,
  LANGUAGE_STORAGE_KEY,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
} from '../config';

describe('i18n/config', () => {
  it('exposes en and fr as the supported languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'fr']);
  });

  it('defaults to English and falls back to English', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(FALLBACK_LANGUAGE).toBe('en');
  });

  it('lists the six namespaces in a stable order', () => {
    expect(NAMESPACES).toEqual([
      'common',
      'auth',
      'subscriptions',
      'statistics',
      'settings',
      'errors',
    ]);
  });

  it('uses the @remindy/language AsyncStorage key', () => {
    expect(LANGUAGE_STORAGE_KEY).toBe('@remindy/language');
  });

  it('provides a label for every supported language', () => {
    SUPPORTED_LANGUAGES.forEach((lng) => {
      expect(LANGUAGE_LABELS[lng]).toBeTruthy();
    });
  });

  describe('isSupportedLanguage', () => {
    it('accepts supported codes', () => {
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(true);
    });

    it('rejects unsupported codes', () => {
      expect(isSupportedLanguage('es')).toBe(false);
      expect(isSupportedLanguage('de')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isSupportedLanguage(null)).toBe(false);
      expect(isSupportedLanguage(undefined)).toBe(false);
      expect(isSupportedLanguage(42)).toBe(false);
      expect(isSupportedLanguage({})).toBe(false);
    });
  });
});
