import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frNav from './locales/fr/nav.json';
import frDashboard from './locales/fr/dashboard.json';
import frSubscription from './locales/fr/subscription.json';
import frCloud from './locales/fr/cloud.json';
import frStatistics from './locales/fr/statistics.json';
import frNotifications from './locales/fr/notifications.json';
import frProfile from './locales/fr/profile.json';
import frPromotion from './locales/fr/promotion.json';
import frLegal from './locales/fr/legal.json';
import frValidation from './locales/fr/validation.json';
import frErrors from './locales/fr/errors.json';
import frCoach from './locales/fr/coach.json';
import frCategory from './locales/fr/category.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enNav from './locales/en/nav.json';
import enDashboard from './locales/en/dashboard.json';
import enSubscription from './locales/en/subscription.json';
import enCloud from './locales/en/cloud.json';
import enStatistics from './locales/en/statistics.json';
import enNotifications from './locales/en/notifications.json';
import enProfile from './locales/en/profile.json';
import enPromotion from './locales/en/promotion.json';
import enLegal from './locales/en/legal.json';
import enValidation from './locales/en/validation.json';
import enErrors from './locales/en/errors.json';
import enCoach from './locales/en/coach.json';
import enCategory from './locales/en/category.json';

export const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    nav: frNav,
    dashboard: frDashboard,
    subscription: frSubscription,
    cloud: frCloud,
    statistics: frStatistics,
    notifications: frNotifications,
    profile: frProfile,
    promotion: frPromotion,
    legal: frLegal,
    validation: frValidation,
    errors: frErrors,
    coach: frCoach,
    category: frCategory,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    nav: enNav,
    dashboard: enDashboard,
    subscription: enSubscription,
    cloud: enCloud,
    statistics: enStatistics,
    notifications: enNotifications,
    profile: enProfile,
    promotion: enPromotion,
    legal: enLegal,
    validation: enValidation,
    errors: enErrors,
    coach: enCoach,
    category: enCategory,
  },
} as const;

export type SupportedLanguage = keyof typeof resources;
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en'];
