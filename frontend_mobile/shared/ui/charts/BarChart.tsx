import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  bars: BarChartBar[];
  height?: number;
  baseColor?: string;
  testID?: string;
}

export function BarChart({
  bars,
  height = 160,
  baseColor = '#6366f1',
  testID = 'bar-chart',
}: BarChartProps): React.ReactElement {
  if (bars.length === 0) {
    return (
      <View testID={`${testID}-empty`} style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>—</Text>
      </View>
    );
  }

  const max = Math.max(...bars.map(b => Math.abs(b.value)), 1);
  const usableHeight = height - 32;

  return (
    <View testID={testID} style={[styles.container, { height }]}>
      <View style={styles.barsRow}>
        {bars.map((bar, index) => {
          const ratio = Math.abs(bar.value) / max;
          const barHeight = Math.max(ratio * usableHeight, 2);
          return (
            <View
              key={`${bar.label}-${index}`}
              testID={`${testID}-bar-${index}`}
              style={styles.column}
            >
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: bar.color ?? baseColor },
                ]}
              />
              <Text style={styles.label} numberOfLines={1}>
                {bar.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9ca3af' },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
  column: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  bar: { width: 24, borderRadius: 6 },
  label: { color: '#9ca3af', fontSize: 11, marginTop: 4 },
});
