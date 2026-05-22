import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ComparisonBadge } from './ComparisonBadge';
import { useCurrencyFormat } from '@/i18n/formatters';
import type { ExpenseTrend } from '@/services/api/statistics.service';

interface ExpenseSummaryHeaderProps {
  periodLabel: string;
  totalAmount: number;
  percentageChange: number;
  trend: ExpenseTrend;
  comparisonLabel: string;
  onInfoPress: () => void;
}

export function ExpenseSummaryHeader({
  periodLabel,
  totalAmount,
  percentageChange,
  trend,
  comparisonLabel,
  onInfoPress,
}: ExpenseSummaryHeaderProps) {
  const { t } = useTranslation('statistics');
  const formatCurrency = useCurrencyFormat('EUR');
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{t('summaryTitle')}</Text>
        <ComparisonBadge
          label={comparisonLabel}
          percentageChange={percentageChange}
          trend={trend}
          onInfoPress={onInfoPress}
        />
      </View>
      <Text testID="expense-period-label" style={styles.periodLabel}>
        {periodLabel}
      </Text>
      <Text testID="expense-total-amount" style={styles.totalAmount}>
        {formatCurrency(totalAmount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a3e',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 12,
  },
  periodLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
  },
  totalAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
  },
});

export default ExpenseSummaryHeader;
