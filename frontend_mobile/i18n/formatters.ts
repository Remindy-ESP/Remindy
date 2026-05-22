import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { SupportedLanguage } from './config';

const LOCALE_TO_BCP47: Record<SupportedLanguage, string> = {
  en: 'en-US',
  fr: 'fr-FR',
};

function resolveLocale(lng: string | undefined): string {
  const base = (lng ?? 'en').split('-')[0];
  return LOCALE_TO_BCP47[base as SupportedLanguage] ?? 'en-US';
}

export function formatCurrency(
  amount: number,
  language: string,
  currency = 'EUR',
): string {
  return new Intl.NumberFormat(resolveLocale(language), {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(
  value: number,
  language: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(resolveLocale(language), options).format(value);
}

export function formatDate(
  date: Date | string,
  language: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(resolveLocale(language), options).format(parsed);
}

export function useCurrencyFormat(currency = 'EUR') {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const formatter = new Intl.NumberFormat(resolveLocale(i18n.language), {
      style: 'currency',
      currency,
    });
    return (amount: number) => formatter.format(amount);
  }, [i18n.language, currency]);
}

export function useDateFormat(
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
) {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat(resolveLocale(i18n.language), options);
    return (date: Date | string) => {
      const parsed = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(parsed.getTime())) {
        return '';
      }
      return formatter.format(parsed);
    };
  }, [i18n.language, options]);
}

export function useNumberFormat(options?: Intl.NumberFormatOptions) {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const formatter = new Intl.NumberFormat(resolveLocale(i18n.language), options);
    return (value: number) => formatter.format(value);
  }, [i18n.language, options]);
}
