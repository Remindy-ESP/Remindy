import * as Localization from 'expo-localization';
import {
  FALLBACK_LANGUAGE,
  SupportedLanguage,
  isSupportedLanguage,
} from './config';
import { getStoredLanguage } from './languageStorage';

function readDeviceLanguage(): SupportedLanguage | null {
  try {
    const locales = Localization.getLocales();
    for (const entry of locales ?? []) {
      const code = entry?.languageCode;
      if (isSupportedLanguage(code)) {
        return code;
      }
    }
  } catch {
    // expo-localization can throw if called too early — fall through
  }
  return null;
}

export async function detectLanguage(): Promise<SupportedLanguage> {
  const stored = await getStoredLanguage();
  if (stored) {
    return stored;
  }

  const device = readDeviceLanguage();
  if (device) {
    return device;
  }

  return FALLBACK_LANGUAGE;
}
