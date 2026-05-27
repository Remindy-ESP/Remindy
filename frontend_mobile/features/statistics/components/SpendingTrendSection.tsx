import React from 'react';
import { useTranslation } from '@/shared/application/I18nContext';
import { ChartContainer } from '@/shared/ui/charts/ChartContainer';
import { LineChart, LineChartPoint } from '@/shared/ui/charts/LineChart';
import { useComparison } from '../hooks/useComparison';
import type { PeriodDateRange } from '@/shared/ui/PeriodFilter/usePeriodFilter';

export interface SpendingTrendSectionProps {
  range: PeriodDateRange;
  categoryId?: string;
}

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'];

function formatBucket(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]}`;
}

export function SpendingTrendSection({
  range,
  categoryId,
}: SpendingTrendSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { data, loading, error } = useComparison({ range, categoryId });

  const points: LineChartPoint[] = data
    ? [
        { label: formatBucket(new Date(data.previous.start)), value: data.previous.total },
        { label: formatBucket(new Date(data.current.start)), value: data.current.total },
      ]
    : [];

  return (
    <ChartContainer
      title={t('charts.trend.title')}
      subtitle={t('charts.trend.subtitle')}
      loading={loading}
      error={error}
      empty={!loading && !error && points.length === 0}
      testID="spending-trend-section"
    >
      <LineChart data={points} testID="spending-trend-chart" />
    </ChartContainer>
  );
}
