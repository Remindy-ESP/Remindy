import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from '@/shared/application/I18nContext';
import { useBudgets } from '../hooks/useBudgets';

export interface BudgetSummaryCardProps {
  onPress?: () => void;
  onCreatePress?: () => void;
}

function formatAmount(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${(amount ?? 0).toFixed(2)} ${currency}`;
  }
}

export function BudgetSummaryCard({
  onPress,
  onCreatePress,
}: BudgetSummaryCardProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const { budgetsWithSpending, loading } = useBudgets({ withSpending: true });

  const open = () => {
    if (onPress) onPress();
    else router.push('/(stack)/budgets');
  };

  const create = () => {
    if (onCreatePress) onCreatePress();
    else router.push('/(stack)/budgets-form');
  };

  const totals = budgetsWithSpending.reduce(
    (acc, b) => {
      acc.budgeted += b.amount;
      acc.spent += b.spent;
      return acc;
    },
    { budgeted: 0, spent: 0 },
  );

  const percent = totals.budgeted > 0 ? Math.round((totals.spent / totals.budgeted) * 100) : 0;
  const currency = budgetsWithSpending[0]?.currency ?? 'EUR';

  if (loading) {
    return (
      <View style={[styles.card, styles.centered]} testID="budget-summary-loading">
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  if (budgetsWithSpending.length === 0) {
    return (
      <View style={styles.card} testID="budget-summary-empty">
        <Text style={styles.title}>{t('budgets.summary.title')}</Text>
        <Text style={styles.subtitle}>{t('budgets.emptyTitle')}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={create}
          testID="budget-summary-create-cta"
        >
          <Text style={styles.ctaText}>{t('budgets.summary.createFirst')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={open}
      testID="budget-summary-card"
      activeOpacity={0.85}
    >
      <Text style={styles.title}>{t('budgets.summary.title')}</Text>
      <Text style={styles.count}>
        {t('budgets.summary.budgetsCount', { count: budgetsWithSpending.length })}
      </Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>{t('budgets.summary.totalBudgeted')}</Text>
          <Text style={styles.amount}>{formatAmount(totals.budgeted, currency)}</Text>
        </View>
        <View>
          <Text style={styles.label}>{t('budgets.summary.totalSpent')}</Text>
          <Text style={styles.amount}>{formatAmount(totals.spent, currency)}</Text>
        </View>
        <View>
          <Text style={styles.label}>%</Text>
          <Text style={styles.amount}>{percent}%</Text>
        </View>
      </View>
      <Text style={styles.cta}>{t('budgets.summary.viewAll')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  centered: { alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 13 },
  count: { color: '#cbd5f5', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { color: '#9ca3af', fontSize: 12 },
  amount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cta: {
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
