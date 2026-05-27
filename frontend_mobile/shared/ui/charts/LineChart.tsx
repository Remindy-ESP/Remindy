import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartPoint[];
  height?: number;
  color?: string;
  testID?: string;
}

export function LineChart({
  data,
  height = 160,
  color = '#6366f1',
  testID = 'line-chart',
}: LineChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <View testID={`${testID}-empty`} style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>—</Text>
      </View>
    );
  }

  const max = Math.max(...data.map(p => p.value), 1);
  const min = Math.min(...data.map(p => p.value), 0);
  const range = max - min || 1;

  return (
    <View testID={testID} style={[styles.container, { height }]}>
      <View style={styles.line}>
        {data.map((point, index) => {
          const fillHeight = ((point.value - min) / range) * (height - 32);
          return (
            <View
              key={`${point.label}-${index}`}
              style={styles.column}
              testID={`${testID}-point-${index}`}
            >
              <View
                style={[
                  styles.bar,
                  { height: Math.max(fillHeight, 2), backgroundColor: color },
                ]}
              />
              <Text numberOfLines={1} style={styles.label}>
                {point.label}
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
  line: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
  },
  column: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  bar: { width: 6, borderRadius: 4 },
  label: { color: '#9ca3af', fontSize: 10, marginTop: 4 },
});
