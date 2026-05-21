import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enSubscriptions from './locales/en/subscriptions.json';
import enStatistics from './locales/en/statistics.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frSubscriptions from './locales/fr/subscriptions.json';
import frStatistics from './locales/fr/statistics.json';
import frSettings from './locales/fr/settings.json';
import frErrors from './locales/fr/errors.json';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    subscriptions: enSubscriptions,
    statistics: enStatistics,
    settings: enSettings,
    errors: enErrors,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    subscriptions: frSubscriptions,
    statistics: frStatistics,
    settings: frSettings,
    errors: frErrors,
  },
} as const;

export type Resources = (typeof resources)['en'];
