import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/context/I18nContext';

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  children: React.ReactNode;
  testID?: string;
}

export function ChartContainer({
  title,
  subtitle,
  loading,
  error,
  empty,
  children,
  testID = 'chart-container',
}: ChartContainerProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered} testID={`${testID}-loading`}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.helperText}>{t('charts.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centered} testID={`${testID}-error`}>
            <Text style={styles.errorText}>{t('charts.errorPrefix', { message: error })}</Text>
          </View>
        ) : empty ? (
          <View style={styles.centered} testID={`${testID}-empty`}>
            <Text style={styles.helperText}>{t('charts.empty')}</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B1B3A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#9ca3af', fontSize: 13 },
  body: { minHeight: 160, justifyContent: 'center' },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  helperText: { color: '#9ca3af', marginTop: 8 },
  errorText: { color: '#ef4444', textAlign: 'center' },
});
