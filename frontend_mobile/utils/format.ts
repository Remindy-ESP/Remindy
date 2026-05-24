import { LocaleConfig } from 'react-native-calendars';
import type { SupportedLanguage } from '@/i18n';

const LOCALE_TAG: Record<SupportedLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-US',
};

export function formatDate(
  date: Date | string | number,
  language: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(LOCALE_TAG[language], options);
}

export function formatShortDate(date: Date | string | number, language: SupportedLanguage): string {
  return formatDate(date, language, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatLongDate(date: Date | string | number, language: SupportedLanguage): string {
  return formatDate(date, language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCurrency(
  amount: number,
  language: SupportedLanguage,
  currency: string = 'EUR',
): string {
  return new Intl.NumberFormat(LOCALE_TAG[language], {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number, language: SupportedLanguage): string {
  return new Intl.NumberFormat(LOCALE_TAG[language]).format(value);
}

interface CalendarLocale {
  monthNames: string[];
  monthNamesShort: string[];
  dayNames: string[];
  dayNamesShort: string[];
  today: string;
}

const CALENDAR_LOCALES: Record<SupportedLanguage, CalendarLocale> = {
  fr: {
    monthNames: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ],
    monthNamesShort: [
      'Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
    ],
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
    today: "Aujourd'hui",
  },
  en: {
    monthNames: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    monthNamesShort: [
      'Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.',
      'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.',
    ],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
    today: 'Today',
  },
};

let calendarLocalesRegistered = false;

export function registerCalendarLocales(): void {
  if (calendarLocalesRegistered) return;
  for (const [lang, locale] of Object.entries(CALENDAR_LOCALES)) {
    LocaleConfig.locales[lang] = locale;
  }
  calendarLocalesRegistered = true;
}

export function setCalendarLocale(language: SupportedLanguage): void {
  registerCalendarLocales();
  LocaleConfig.defaultLocale = language;
}
