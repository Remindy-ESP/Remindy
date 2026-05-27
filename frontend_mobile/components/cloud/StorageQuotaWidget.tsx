import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StorageQuota } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';

interface StorageQuotaWidgetProps {
  readonly quota: StorageQuota | null;
}

export default function StorageQuotaWidget({ quota }: StorageQuotaWidgetProps) {
  const { t } = useTranslation();

  if (!quota || typeof quota !== 'object') return null;

  const pct = quota.usagePercentage ?? 0;

  const getBarColor = () => {
    if (pct >= 90) return '#E74C3C';
    if (pct >= 70) return '#F39C12';
    return '#6366f1';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cloud.quota.title')}</Text>
        <Text style={styles.usage}>
          {quota.usedFormatted ?? '—'} / {quota.totalFormatted ?? '—'}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: getBarColor() }]} />
      </View>
      <Text style={styles.percentage}>{pct.toFixed(1)}{t('cloud.quota.usedSuffix')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F1F39',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#373848',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usage: {
    color: '#9ca3af',
    fontSize: 14,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#373848',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'right',
  },
});
