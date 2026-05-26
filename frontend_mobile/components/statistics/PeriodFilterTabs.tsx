import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Period } from '@/types/statistics';
import { useTranslation } from '@/context/I18nContext';

interface PeriodFilterTabsProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

const PERIOD_KEYS: Period[] = ['day', 'week', 'month', 'year'];

export function PeriodFilterTabs({ selectedPeriod, onPeriodChange }: PeriodFilterTabsProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.periodSection}>
      <View style={styles.periodMenu}>
        {PERIOD_KEYS.map((key) => {
          const isActive = selectedPeriod === key;
          return (
            <TouchableOpacity
              key={key}
              testID={`period-${key}`}
              style={[
                styles.periodTab,
                isActive ? styles.periodTabActive : styles.periodTabInactive,
              ]}
              onPress={() => onPeriodChange(key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodTabText,
                  isActive ? styles.periodTabTextActive : styles.periodTabTextInactive,
                ]}
              >
                {t(`statistics.periods.${key}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  periodSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  periodMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: '#000',
  },
  periodTabInactive: {
    backgroundColor: 'transparent',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  periodTabTextInactive: {
    color: '#000',
    opacity: 0.6,
  },
});

export default PeriodFilterTabs;
