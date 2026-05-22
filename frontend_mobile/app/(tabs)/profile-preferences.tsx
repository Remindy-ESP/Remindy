import React from 'react';
import { useTranslation } from 'react-i18next';
import PlaceholderScreen from '@/components/profile/PlaceholderScreen';

export default function ProfilePreferencesScreen() {
  const { t } = useTranslation('settings');
  return (
    <PlaceholderScreen
      title={t('preferences.title')}
      subtitle={t('preferences.subtitle')}
      message={t('preferences.message')}
    />
  );
}
