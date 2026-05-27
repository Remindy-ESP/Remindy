import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import i18n, {
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/i18n';
import { setCalendarLocale } from '@/utils/format';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { userService } from '@/services/api';

const STORAGE_KEY = '@remindy/lang';

type TranslateOptions = Record<string, unknown> & { count?: number };

interface I18nContextValue {
  language: SupportedLanguage;
  ready: boolean;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, options?: TranslateOptions) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectDeviceLanguage(): SupportedLanguage {
  const locales = Localization.getLocales?.() ?? [];
  const code = locales[0]?.languageCode?.toLowerCase();
  return isSupportedLanguage(code) ? code : 'fr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>('fr');
  const [ready, setReady] = useState(false);
  const lastBackendSyncRef = useRef<SupportedLanguage | null>(null);
  const hydratedFromBackendRef = useRef(false);

  const applyLocale = useCallback((lang: SupportedLanguage) => {
    i18n.locale = lang;
    setCalendarLocale(lang);
    setLanguageState(lang);
  }, []);

  // Bootstrap: AsyncStorage → device locale → 'fr'
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const initial: SupportedLanguage = isSupportedLanguage(stored)
          ? stored
          : detectDeviceLanguage();
        if (cancelled) return;
        applyLocale(initial);
      } catch (err) {
        console.warn('[i18n] bootstrap failed, defaulting to fr', err);
        if (!cancelled) applyLocale('fr');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLocale]);

  // Hydrate from authenticated user.language once per login (new device sync)
  useEffect(() => {
    if (!ready || !user?.language) return;
    if (!isSupportedLanguage(user.language)) return;
    if (hydratedFromBackendRef.current) return;
    hydratedFromBackendRef.current = true;
    if (user.language === language) return;
    applyLocale(user.language);
    lastBackendSyncRef.current = user.language;
    AsyncStorage.setItem(STORAGE_KEY, user.language).catch(() => undefined);
  }, [ready, user?.language, applyLocale]);

  const setLanguage = useCallback(
    async (lang: SupportedLanguage) => {
      applyLocale(lang);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, lang);
      } catch (err) {
        console.warn('[i18n] failed to persist language', err);
      }
      if (isAuthenticated && lastBackendSyncRef.current !== lang) {
        lastBackendSyncRef.current = lang;
        userService
          .updateMe({ language: lang })
          .catch((err) => console.warn('[i18n] backend sync failed', err));
      }
    },
    [applyLocale, isAuthenticated],
  );

  const t = useCallback(
    (key: string, options?: TranslateOptions) => i18n.t(key, options),
    // language in deps so consumers re-render when locale changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, ready, setLanguage, t }),
    [language, ready, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage };
