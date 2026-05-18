export type Period = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'Ce jour',
  week: 'Semaine',
  month: 'Mensuel',
  year: 'Année',
};

export const COMPARISON_LABELS: Record<Period, string> = {
  day: 'Comparo M-1',
  week: 'Comparo S-1',
  month: 'Comparo M-1',
  year: 'Comparo A-1',
};
