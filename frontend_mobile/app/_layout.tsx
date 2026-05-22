import { Stack } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
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
    // Configure la barre de navigation système pour Android
    if (Platform.OS === 'android') {
      // Active le mode immersif - la barre se cache et réapparaît avec un geste de balayage
      NavigationBar.setBehaviorAsync('overlay-swipe');

      // Cache la barre de navigation
      NavigationBar.setVisibilityAsync('hidden');

      // Optionnel : définit la couleur de la barre quand elle apparaît
      NavigationBar.setBackgroundColorAsync('#11112A');

      // Optionnel : définit le style des boutons (light ou dark)
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <AuthProvider>
      <I18nProvider>
        <CoachMarksProvider>
          <StatusBar style="light" />
          <View style={{ flex: 1 }}>
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
          </View>
        </CoachMarksProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
