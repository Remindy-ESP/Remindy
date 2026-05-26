import { I18n } from 'i18n-js';
import { resources, SUPPORTED_LANGUAGES, type SupportedLanguage } from './resources';

const i18n = new I18n(resources);

i18n.defaultLocale = 'fr';
i18n.locale = 'fr';
i18n.enableFallback = true;
i18n.missingBehavior = 'guess';

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return !!value && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage };
export default i18n;
