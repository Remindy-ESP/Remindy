import { useCallback, useEffect, useState } from 'react';
import { budgetsApi } from '../api/budgets.api';
import {
  Budget,
  BudgetListFilters,
  BudgetWithSpending,
  CreateBudgetInput,
} from '../types/budget.types';

interface UseBudgetsOptions {
  filters?: BudgetListFilters;
  withSpending?: boolean;
}

interface UseBudgetsResult {
  budgets: Budget[];
  budgetsWithSpending: BudgetWithSpending[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (input: CreateBudgetInput) => Promise<Budget>;
  remove: (id: string) => Promise<void>;
}

export function useBudgets(options: UseBudgetsOptions = {}): UseBudgetsResult {
  const { filters, withSpending = false } = options;
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isActive = filters?.isActive;
  const categoryId = filters?.categoryId;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const f: BudgetListFilters = { isActive, categoryId };
      if (withSpending) {
        const result = await budgetsApi.listWithSpending(f);
        const safe = Array.isArray(result) ? result : [];
        setBudgetsWithSpending(safe);
        setBudgets(safe);
      } else {
        const result = await budgetsApi.list(f);
        setBudgets(Array.isArray(result) ? result : []);
        setBudgetsWithSpending([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setBudgets([]);
      setBudgetsWithSpending([]);
    } finally {
      setLoading(false);
    }
  }, [isActive, categoryId, withSpending]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(
    async (input: CreateBudgetInput) => {
      const created = await budgetsApi.create(input);
      setBudgets(prev => [created, ...prev]);
      await fetchData();
      return created;
    },
    [fetchData],
  );

  const remove = useCallback(
    async (id: string) => {
      const previousBudgets = budgets;
      const previousWithSpending = budgetsWithSpending;
      setBudgets(prev => prev.filter(b => b.id !== id));
      setBudgetsWithSpending(prev => prev.filter(b => b.id !== id));
      try {
        await budgetsApi.remove(id);
      } catch (err) {
        setBudgets(previousBudgets);
        setBudgetsWithSpending(previousWithSpending);
        throw err;
      }
    },
    [budgets, budgetsWithSpending],
  );

  return { budgets, budgetsWithSpending, loading, error, refetch: fetchData, create, remove };
}
