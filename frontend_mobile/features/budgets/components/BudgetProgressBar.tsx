import React from 'react';
import { View, StyleSheet } from 'react-native';

export interface BudgetProgressBarProps {
  progress: number;
  height?: number;
  trackColor?: string;
}

export const PROGRESS_COLORS = {
  ok: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const;

export function colorForProgress(progress: number): string {
  if (progress >= 0.9) return PROGRESS_COLORS.danger;
  if (progress >= 0.7) return PROGRESS_COLORS.warning;
  return PROGRESS_COLORS.ok;
}

export function BudgetProgressBar({
  progress,
  height = 8,
  trackColor = '#1f2540',
}: BudgetProgressBarProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(1, progress));
  const color = colorForProgress(progress);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor }]}
      testID="budget-progress-bar"
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
        testID="budget-progress-bar-fill"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 8,
  },
});
