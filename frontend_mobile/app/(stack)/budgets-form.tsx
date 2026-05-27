import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { BudgetFormScreen } from '@/features/budgets/screens/BudgetFormScreen';

export default function BudgetsFormRoute(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id.length > 0 ? params.id : null;
  return <BudgetFormScreen budgetId={id} />;
}
