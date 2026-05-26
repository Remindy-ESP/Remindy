import { useCallback, useEffect, useState } from 'react';
import { budgetsApi } from '../api/budgets.api';
import {
  Budget,
  BudgetWithSpending,
  UpdateBudgetInput,
} from '../types/budget.types';

interface UseBudgetOptions {
  withSpending?: boolean;
}

interface UseBudgetResult {
  budget: Budget | null;
  budgetWithSpending: BudgetWithSpending | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (input: UpdateBudgetInput) => Promise<Budget>;
}

export function useBudget(id: string | null, options: UseBudgetOptions = {}): UseBudgetResult {
  const { withSpending = false } = options;
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetWithSpending, setBudgetWithSpending] = useState<BudgetWithSpending | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setBudget(null);
      setBudgetWithSpending(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (withSpending) {
        const result = await budgetsApi.getOneWithSpending(id);
        setBudgetWithSpending(result);
        setBudget(result);
      } else {
        const result = await budgetsApi.getOne(id);
        setBudget(result);
        setBudgetWithSpending(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setBudget(null);
      setBudgetWithSpending(null);
    } finally {
      setLoading(false);
    }
  }, [id, withSpending]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const update = useCallback(
    async (input: UpdateBudgetInput) => {
      if (!id) throw new Error('Cannot update a budget without an id');
      const updated = await budgetsApi.update(id, input);
      setBudget(updated);
      if (withSpending) {
        await fetchData();
      }
      return updated;
    },
    [id, withSpending, fetchData],
  );

  return { budget, budgetWithSpending, loading, error, refetch: fetchData, update };
}
