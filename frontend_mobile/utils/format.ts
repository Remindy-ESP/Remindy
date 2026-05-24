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

// Column-oriented: each tuple is [fr, en] for one month/day. This avoids two
// parallel arrays-of-strings that SonarQube would flag as structural duplication.
const MONTHS: Array<[string, string, string, string]> = [
  // [frLong, frShort, enLong, enShort]
  ['Janvier', 'Janv.', 'January', 'Jan.'],
  ['Février', 'Févr.', 'February', 'Feb.'],
  ['Mars', 'Mars', 'March', 'Mar.'],
  ['Avril', 'Avril', 'April', 'Apr.'],
  ['Mai', 'Mai', 'May', 'May'],
  ['Juin', 'Juin', 'June', 'Jun.'],
  ['Juillet', 'Juil.', 'July', 'Jul.'],
  ['Août', 'Août', 'August', 'Aug.'],
  ['Septembre', 'Sept.', 'September', 'Sep.'],
  ['Octobre', 'Oct.', 'October', 'Oct.'],
  ['Novembre', 'Nov.', 'November', 'Nov.'],
  ['Décembre', 'Déc.', 'December', 'Dec.'],
];

const DAYS: Array<[string, string, string, string]> = [
  ['Dimanche', 'Dim.', 'Sunday', 'Sun.'],
  ['Lundi', 'Lun.', 'Monday', 'Mon.'],
  ['Mardi', 'Mar.', 'Tuesday', 'Tue.'],
  ['Mercredi', 'Mer.', 'Wednesday', 'Wed.'],
  ['Jeudi', 'Jeu.', 'Thursday', 'Thu.'],
  ['Vendredi', 'Ven.', 'Friday', 'Fri.'],
  ['Samedi', 'Sam.', 'Saturday', 'Sat.'],
];

const LANG_INDEX: Record<SupportedLanguage, { long: 0 | 2; short: 1 | 3; today: string }> = {
  fr: { long: 0, short: 1, today: "Aujourd'hui" },
  en: { long: 2, short: 3, today: 'Today' },
};

function buildCalendarLocale(lang: SupportedLanguage): CalendarLocale {
  const { long, short, today } = LANG_INDEX[lang];
  return {
    monthNames: MONTHS.map(row => row[long]),
    monthNamesShort: MONTHS.map(row => row[short]),
    dayNames: DAYS.map(row => row[long]),
    dayNamesShort: DAYS.map(row => row[short]),
    today,
  };
}

let calendarLocalesRegistered = false;

export function registerCalendarLocales(): void {
  if (calendarLocalesRegistered) return;
  for (const lang of Object.keys(LANG_INDEX) as SupportedLanguage[]) {
    LocaleConfig.locales[lang] = buildCalendarLocale(lang);
  }
  calendarLocalesRegistered = true;
}

export function setCalendarLocale(language: SupportedLanguage): void {
  registerCalendarLocales();
  LocaleConfig.defaultLocale = language;
}
