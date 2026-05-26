import React, { useMemo } from 'react';
import { useTranslation } from '@/context/I18nContext';
import { ChartContainer } from '@/components/charts/ChartContainer';
import { PieChart, PieChartSlice } from '@/components/charts/PieChart';
import { CategoryGrid, CategoryGridItem } from './CategoryGrid';

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  icon?: string | null;
  color: string;
  total: number;
}

export interface CategoryBreakdownSectionProps {
  items: CategoryBreakdownItem[];
  loading?: boolean;
  error?: string | null;
  currency?: string;
  testID?: string;
}

export function CategoryBreakdownSection({
  items,
  loading,
  error,
  currency = 'EUR',
  testID = 'category-breakdown-section',
}: CategoryBreakdownSectionProps): React.ReactElement {
  const { t } = useTranslation();

  const total = useMemo(() => items.reduce((acc, item) => acc + Math.max(0, item.total), 0), [items]);

  const slices: PieChartSlice[] = useMemo(
    () =>
      items.map(item => ({
        label: item.name,
        value: Math.max(0, item.total),
        color: item.color,
      })),
    [items],
  );

  const cards: CategoryGridItem[] = useMemo(
    () =>
      items.map(item => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        amount: item.total,
        share: total > 0 ? item.total / total : 0,
        currency,
      })),
    [items, total, currency],
  );

  return (
    <ChartContainer
      title={t('charts.categoryBreakdown.title')}
      loading={loading}
      error={error}
      empty={!loading && !error && items.length === 0}
      testID={testID}
    >
      <PieChart data={slices} testID={`${testID}-pie`} />
      <CategoryGrid items={cards} testID={`${testID}-grid`} />
    </ChartContainer>
  );
}
