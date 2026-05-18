import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ExpenseTrend } from '@/services/api/statistics.service';

interface ComparisonBadgeProps {
  label: string;
  percentageChange: number;
  trend: ExpenseTrend;
  onInfoPress: () => void;
}

const TREND_COLORS: Record<ExpenseTrend, string> = {
  down: '#22c55e',
  up: '#ef4444',
  stable: '#888888',
};

function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function ComparisonBadge({
  label,
  percentageChange,
  trend,
  onInfoPress,
}: ComparisonBadgeProps) {
  const color = TREND_COLORS[trend];
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
      <Text testID="comparison-percentage" style={[styles.percentage, { color }]}>
        {formatPercentage(percentageChange)}
      </Text>
      <TouchableOpacity
        testID="comparison-info-button"
        accessibilityLabel="Plus d'informations sur la comparaison"
        onPress={onInfoPress}
        style={styles.infoButton}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <Text style={styles.infoIcon}>ⓘ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: '#2a2a5e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoButton: {
    padding: 2,
  },
  infoIcon: {
    color: '#9ca3af',
    fontSize: 18,
  },
});

export default ComparisonBadge;
