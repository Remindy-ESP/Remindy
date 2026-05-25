import { BudgetPeriod } from '../../domain/budget.entity';

export interface UpdateBudgetAppDto {
  name?: string;
  amount?: number;
  currency?: string;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date | null;
  categoryId?: string | null;
  isActive?: boolean;
  notes?: string;
}
