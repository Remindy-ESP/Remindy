import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/context/AuthContext';
import { I18nProvider } from '@/context/I18nContext';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import AppStatusScreen from '@/components/system/AppStatusScreen';
import { CoachMarksProvider } from '@/features/coach-marks/CoachMarksContext';
import CoachMarksOverlay from '@/components/system/CoachMarksOverlay';
import i18n from '@/i18n';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <AppStatusScreen
      code="500"
      title={i18n.t('common.errorBoundary.title')}
      message={i18n.t('common.errorBoundary.message')}
      actions={[
        {
          label: i18n.t('common.errorBoundary.action'),
          onPress: retry,
          testID: 'error-500-retry-button',
        },
      ]}
    />
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBackgroundColorAsync('#11112A');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <AuthProvider>
      <I18nProvider>
        <CoachMarksProvider>
          <StatusBar style="light" />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#fff' },
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(stack)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="forgot-password"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="reset-password"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
            <CoachMarksOverlay />
          </GestureHandlerRootView>
        </CoachMarksProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
