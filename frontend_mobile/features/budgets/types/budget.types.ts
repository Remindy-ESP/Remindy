export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  categoryId: string | null;
  subscriptionIds: string[];
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  progress: number;
  isOverBudget: boolean;
}

export interface CreateBudgetInput {
  name: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string | null;
  categoryId?: string | null;
  subscriptionIds?: string[];
  isActive?: boolean;
  notes?: string;
}

export interface UpdateBudgetInput {
  name?: string;
  amount?: number;
  currency?: string;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string | null;
  categoryId?: string | null;
  subscriptionIds?: string[];
  isActive?: boolean;
  notes?: string;
}

export interface BudgetListFilters {
  isActive?: boolean;
  categoryId?: string;
}
