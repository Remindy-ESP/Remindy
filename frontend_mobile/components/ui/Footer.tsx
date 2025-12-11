import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';

export function Footer() {
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'background');
  const textColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { backgroundColor }]}
    >
      <View style={styles.container}>
        <Text style={[styles.text, { color: textColor }]}>
          © {new Date().getFullYear()} Remindy. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
      },
      default: {
        fontWeight: '400',
      },
    }),
  },
});
