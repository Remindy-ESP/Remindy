import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@/context/I18nContext';

export type PeriodOption = 'day' | 'week' | 'month' | 'year';
export const PERIOD_OPTIONS: readonly PeriodOption[] = ['day', 'week', 'month', 'year'] as const;

export interface PeriodFilterProps {
  value: PeriodOption;
  onChange: (next: PeriodOption) => void;
  options?: readonly PeriodOption[];
  testID?: string;
}

export function PeriodFilter({
  value,
  onChange,
  options = PERIOD_OPTIONS,
  testID = 'period-filter',
}: PeriodFilterProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.tabs}>
        {options.map(option => {
          const isActive = value === option;
          return (
            <TouchableOpacity
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              testID={`${testID}-${option}`}
              style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
              onPress={() => onChange(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
                {t(`statistics.periods.${option}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabs: {
    backgroundColor: '#1B1B3A',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextInactive: {
    color: '#cbd5f5',
  },
});

export default PeriodFilter;
