import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface CategoryCardProps {
  name: string;
  icon?: string | null;
  color: string;
  amount: number;
  share: number;
  currency?: string;
  testID?: string;
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

export function CategoryCard({
  name,
  icon,
  color,
  amount,
  share,
  currency = 'EUR',
  testID,
}: CategoryCardProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(1, share));
  const percent = Math.round(clamped * 100);
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.header}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Text style={styles.amount}>{formatAmount(amount, currency)}</Text>
      <Text style={styles.share}>{percent}%</Text>
      <View style={styles.track}>
        <View
          testID={testID ? `${testID}-bar` : undefined}
          style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B1B3A',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 16 },
  name: { color: '#fff', fontWeight: '600', flex: 1 },
  amount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  share: { color: '#9ca3af', fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#11112A', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
