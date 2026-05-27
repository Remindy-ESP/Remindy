import { Stack, useRouter } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '@/modules/auth/application/AuthContext';
import { I18nProvider } from '@/shared/application/I18nContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ActionSheetProvider } from '@/context/ActionSheetContext';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import AppStatusScreen from '@/shared/ui/system/AppStatusScreen';
import { CoachMarksProvider } from '@/features/coach-marks/CoachMarksContext';
import CoachMarksOverlay from '@/shared/ui/system/CoachMarksOverlay';
import i18n from '@/i18n';
import { APP_ROUTES } from '@/navigation/MenuConfig';

const footerRoutes = APP_ROUTES.filter(r => r.showInFooter && r.footerIcon);

function ErrorTabBar() {
  const router = useRouter();
  return (
    <SafeAreaView edges={['bottom']} style={errorStyles.tabBar}>
      {footerRoutes.map(route => (
        <TouchableOpacity
          key={route.key}
          style={errorStyles.tabItem}
          onPress={() => router.replace(route.route as any)}
          activeOpacity={0.7}
        >
          <Ionicons name={route.footerIcon as any} size={24} color="#9ca3af" />
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const errorStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06071D' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#06071D',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
});

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={errorStyles.root}>
      <View style={{ flex: 1 }}>
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
      </View>
      <ErrorTabBar />
    </View>
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
        <ToastProvider>
        <ConfirmProvider>
        <ActionSheetProvider>
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
        </ActionSheetProvider>
        </ConfirmProvider>
        </ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
