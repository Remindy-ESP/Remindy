import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/context/I18nContext';
import { useComparison } from '../hooks/useComparison';
import type { PeriodDateRange } from '@/components/PeriodFilter/usePeriodFilter';

export interface ComparisonSectionProps {
  range: PeriodDateRange;
  categoryId?: string;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function ComparisonSection({
  range,
  categoryId,
}: ComparisonSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const { data, loading, error } = useComparison({ range, categoryId });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]} testID="comparison-loading">
        <ActivityIndicator size="small" color="#6366f1" />
        <Text style={styles.loadingText}>{t('comparison.loading')}</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, styles.centered]} testID="comparison-error">
        <Text style={styles.errorText}>
          {t('comparison.errorPrefix', { message: error ?? 'no data' })}
        </Text>
      </View>
    );
  }

  const isUp = data.trend === 'up';
  const isDown = data.trend === 'down';
  const deltaAmount = formatAmount(Math.abs(data.delta));
  const percentColor = isUp ? '#ef4444' : isDown ? '#22c55e' : '#9ca3af';
  const deltaLabel = isUp
    ? t('comparison.deltaUp', { amount: deltaAmount })
    : isDown
      ? t('comparison.deltaDown', { amount: deltaAmount })
      : t('comparison.deltaFlat', { amount: deltaAmount });

  const percentKey =
    isUp ? 'comparison.percentageUp' : isDown ? 'comparison.percentageDown' : 'comparison.percentageStable';
  const percentLabel = t(percentKey, {
    value: isDown ? data.percentageChange : Math.abs(data.percentageChange),
  });

  let narrative: string;
  if (data.previous.total === 0 && data.current.total > 0) {
    narrative = t('comparison.narrativeFromZero');
  } else if (isUp) {
    narrative = t('comparison.narrativeUp', { amount: deltaAmount });
  } else if (isDown) {
    narrative = t('comparison.narrativeDown', { amount: deltaAmount });
  } else {
    narrative = t('comparison.narrativeStable');
  }

  return (
    <View style={styles.container} testID="comparison-section">
      <Text style={styles.title}>{t('comparison.sectionTitle')}</Text>

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('comparison.currentPeriod')}</Text>
          <Text style={styles.amount}>{formatAmount(data.current.total)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>{t('comparison.previousPeriod')}</Text>
          <Text style={styles.amount}>{formatAmount(data.previous.total)}</Text>
        </View>
      </View>

      <View style={styles.deltaRow} testID="comparison-delta">
        <Text style={[styles.delta, { color: percentColor }]}>{deltaLabel}</Text>
        <Text style={[styles.percent, { color: percentColor }]}>{percentLabel}</Text>
      </View>

      <Text style={styles.narrative}>{narrative}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9ca3af', marginTop: 8 },
  errorText: { color: '#ef4444', textAlign: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { flex: 1 },
  label: { color: '#9ca3af', fontSize: 12 },
  amount: { color: '#fff', fontSize: 18, fontWeight: '700' },
  deltaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  delta: { fontSize: 16, fontWeight: '700' },
  percent: { fontSize: 12, fontWeight: '600' },
  narrative: { color: '#cbd5f5', fontSize: 13 },
});
