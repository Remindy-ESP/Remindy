import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppStatusScreen from '@/shared/ui/system/AppStatusScreen';
import { useTranslation } from '@/shared/application/I18nContext';
import { APP_ROUTES } from '@/navigation/MenuConfig';

const footerRoutes = APP_ROUTES.filter(r => r.showInFooter && r.footerIcon);

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <AppStatusScreen
          code="404"
          title={t('auth.notFound.title')}
          message={t('auth.notFound.message')}
          actions={[
            {
              label: t('auth.notFound.home'),
              onPress: () => router.replace('/(tabs)/dashboard'),
              testID: 'not-found-home-button',
            },
            {
              label: t('auth.notFound.back'),
              onPress: () => router.back(),
              variant: 'secondary',
              testID: 'not-found-back-button',
            },
          ]}
        />
      </View>

      <SafeAreaView edges={['bottom']} style={styles.tabBar}>
        {footerRoutes.map(route => (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => router.replace(route.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={route.footerIcon as any} size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#06071D',
    borderTopWidth: 0,
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
