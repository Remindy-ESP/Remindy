export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

export const NAMESPACES = [
  'common',
  'auth',
  'subscriptions',
  'statistics',
  'settings',
  'errors',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = 'common';

export const LANGUAGE_STORAGE_KEY = '@remindy/language';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
};

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}
