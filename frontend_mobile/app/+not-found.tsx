import React from 'react';
import { useRouter } from 'expo-router';
import AppStatusScreen from '@/components/system/AppStatusScreen';
import { useTranslation } from '@/context/I18nContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
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
  );
}

