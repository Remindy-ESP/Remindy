import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PeriodFilter } from '@/shared/ui/PeriodFilter/PeriodFilter';
import {
  PeriodDateRange,
  usePeriodFilter,
} from '@/shared/ui/PeriodFilter/usePeriodFilter';
import type { PeriodOption } from '@/shared/ui/PeriodFilter/PeriodFilter';

export interface AnalyticsSectionRenderProps {
  period: PeriodOption;
  range: PeriodDateRange;
}

export interface AnalyticsSectionProps {
  initialPeriod?: PeriodOption;
  children?: (props: AnalyticsSectionRenderProps) => React.ReactNode;
}

export function AnalyticsSection({
  initialPeriod = 'month',
  children,
}: AnalyticsSectionProps): React.ReactElement {
  const { period, setPeriod, range } = usePeriodFilter({ initialPeriod });

  return (
    <View style={styles.container} testID="analytics-section">
      <PeriodFilter value={period} onChange={setPeriod} testID="analytics-period-filter" />
      {children ? children({ period, range }) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 24,
  },
});
