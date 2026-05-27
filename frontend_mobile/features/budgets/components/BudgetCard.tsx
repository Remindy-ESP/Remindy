import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/context/I18nContext';
import { BudgetWithSpending } from '../types/budget.types';
import { BudgetProgressBar } from './BudgetProgressBar';

export interface BudgetCardProps {
  budget: BudgetWithSpending;
  onPress?: (budget: BudgetWithSpending) => void;
}

function formatCurrency(amount: number, currency: string): string {
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

export function BudgetCard({ budget, onPress }: BudgetCardProps): React.ReactElement {
  const { t } = useTranslation();
  const Wrapper = onPress ? TouchableOpacity : View;
  const periodLabel =
    budget.period === 'monthly' ? t('budgets.card.monthly') : t('budgets.card.yearly');
  const progressPercent = Math.round(Math.max(0, Math.min(1, budget.progress)) * 100);
  const overAmount = budget.isOverBudget
    ? formatCurrency(Math.abs(budget.remaining), budget.currency)
    : null;

  return (
    <Wrapper
      style={styles.card}
      onPress={onPress ? () => onPress(budget) : undefined}
      activeOpacity={0.85}
      testID={`budget-card-${budget.id}`}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {budget.name}
        </Text>
        <Text style={styles.period}>{periodLabel}</Text>
      </View>

      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.label}>{t('budgets.card.spent')}</Text>
          <Text style={styles.spentAmount}>{formatCurrency(budget.spent, budget.currency)}</Text>
        </View>
        <View style={styles.totalGroup}>
          <Text style={styles.label}>/ {formatCurrency(budget.amount, budget.currency)}</Text>
        </View>
      </View>

      <BudgetProgressBar progress={budget.progress} />

      <View style={styles.footerRow}>
        {budget.isOverBudget && overAmount ? (
          <Text style={styles.over}>{t('budgets.card.overBudget', { amount: overAmount })}</Text>
        ) : (
          <Text style={styles.remaining}>
            {t('budgets.card.remaining')}: {formatCurrency(budget.remaining, budget.currency)}
          </Text>
        )}
        <Text style={styles.percent}>
          {t('budgets.card.progressLabel', { percent: progressPercent })}
        </Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  period: {
    color: '#9ca3af',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#11112A',
    borderRadius: 8,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    color: '#9ca3af',
    fontSize: 12,
  },
  totalGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spentAmount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remaining: {
    color: '#9ca3af',
    fontSize: 13,
  },
  over: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  percent: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
});
