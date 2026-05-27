import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface PieChartProps {
  data: PieChartSlice[];
  size?: number;
  testID?: string;
}

export function PieChart({
  data,
  size = 160,
  testID = 'pie-chart',
}: PieChartProps): React.ReactElement {
  const total = data.reduce((acc, slice) => acc + Math.max(0, slice.value), 0);

  if (data.length === 0 || total === 0) {
    return (
      <View testID={`${testID}-empty`} style={[styles.empty, { width: size, height: size }]}>
        <Text style={styles.emptyText}>—</Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={styles.container}>
      <View style={[styles.pie, { width: size, height: size }]}>
        <View style={styles.barRow}>
          {data.map((slice, index) => {
            const ratio = Math.max(0, slice.value) / total;
            return (
              <View
                key={`${slice.label}-${index}`}
                testID={`${testID}-slice-${index}`}
                style={[
                  styles.slice,
                  { flex: ratio || 0.0001, backgroundColor: slice.color },
                ]}
              />
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((slice, index) => {
          const percent = Math.round((Math.max(0, slice.value) / total) * 100);
          return (
            <View key={`${slice.label}-${index}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {slice.label} · {percent}%
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9ca3af' },
  pie: { borderRadius: 1000, overflow: 'hidden', backgroundColor: '#111128' },
  barRow: { flex: 1, flexDirection: 'row' },
  slice: { height: '100%' },
  legend: { width: '100%', gap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: '#cbd5f5', fontSize: 12, flex: 1 },
});
