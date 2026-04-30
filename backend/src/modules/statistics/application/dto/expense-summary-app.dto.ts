export type ExpenseTrend = 'up' | 'down' | 'stable';

export interface ExpenseSummaryAppDto {
  periodLabel: string;
  currentTotal: number;
  previousTotal: number;
  percentageChange: number;
  trend: ExpenseTrend;
  comparisonLabel: string;
}
