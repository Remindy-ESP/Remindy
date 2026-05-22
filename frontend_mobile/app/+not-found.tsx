import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AppStatusScreen from '@/components/system/AppStatusScreen';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <AppStatusScreen
      code="404"
      title={t('notFound.title')}
      message={t('notFound.message')}
      actions={[
        {
          label: t('notFound.goHome'),
          onPress: () => router.replace('/(tabs)/dashboard'),
          testID: 'not-found-home-button',
        },
        {
          label: t('notFound.goBack'),
          onPress: () => router.back(),
          variant: 'secondary',
          testID: 'not-found-back-button',
        },
      ]}
    />
  );
}
