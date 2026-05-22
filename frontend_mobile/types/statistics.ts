export type Period = 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
}

export const PERIOD_KEYS: readonly Period[] = ['day', 'week', 'month', 'year'] as const;
