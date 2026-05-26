export type ComparisonTrend = 'up' | 'down' | 'stable';

export interface ComparisonPeriod {
  start: Date;
  end: Date;
  total: number;
}

export interface ComparisonAppDto {
  current: ComparisonPeriod;
  previous: ComparisonPeriod;
  delta: number;
  percentageChange: number;
  trend: ComparisonTrend;
}
