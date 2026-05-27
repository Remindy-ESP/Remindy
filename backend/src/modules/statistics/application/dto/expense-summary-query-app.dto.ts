import type { Period } from '../../domain/value-objects/date-range.vo';

export interface ExpenseSummaryQueryAppDto {
  userId: string;
  period: Period;
  referenceDate?: Date;
}
