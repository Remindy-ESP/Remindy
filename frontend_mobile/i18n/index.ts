import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  DEFAULT_NAMESPACE,
  FALLBACK_LANGUAGE,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from './config';
import { detectLanguage } from './detectLanguage';
import { setStoredLanguage } from './languageStorage';

const emptyResources = SUPPORTED_LANGUAGES.reduce(
  (acc, lng) => {
    acc[lng] = NAMESPACES.reduce(
      (ns, name) => {
        ns[name] = {};
        return ns;
      },
      {} as Record<string, object>,
    );
    return acc;
  },
  {} as Record<SupportedLanguage, Record<string, object>>,
);

i18n.use(initReactI18next).init({
  resources: emptyResources,
  lng: FALLBACK_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  ns: NAMESPACES as unknown as string[],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
  react: { useSuspense: false },
});

let initPromise: Promise<void> | null = null;

export function initI18n(): Promise<void> {
  if (!initPromise) {
    initPromise = detectLanguage().then(async (lng) => {
      if (i18n.language !== lng) {
        await i18n.changeLanguage(lng);
      }
    });
  }
  return initPromise;
}

export async function changeAppLanguage(
  language: SupportedLanguage,
): Promise<void> {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
}

// Kick off async detection on module load; safe to fire-and-forget — UI
// reactivity through react-i18next will refresh strings once it resolves.
void initI18n();

export default i18n;
