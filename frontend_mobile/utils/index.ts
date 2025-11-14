export type TimePeriod = 'day' | 'week' | 'month' | 'year';

export interface TimePeriodOption {
  key: TimePeriod;
  label: string;
  value: string;
}


export const TIME_PERIODS: TimePeriodOption[] = [
  { key: 'day', label: 'Ce jour', value: '1' },
  { key: 'week', label: 'Semaine', value: '2' },
  { key: 'month', label: 'Mensuel', value: '3' },
  { key: 'year', label: 'Année', value: '4' },
];

export const getContentForPeriod = (period: TimePeriod): string => {
  const periodData = TIME_PERIODS.find((p) => p.key === period);
  return periodData?.value || '1';
};