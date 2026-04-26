import React from 'react';
import { useRouter } from 'expo-router';
import AppStatusScreen from '@/components/system/AppStatusScreen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppStatusScreen
      code="404"
      title="Page introuvable"
      message="La page que vous cherchez n existe pas ou n est plus disponible."
      actions={[
        {
          label: 'Retour a l accueil',
          onPress: () => router.replace('/(tabs)/dashboard'),
          testID: 'not-found-home-button',
        },
        {
          label: 'Retour',
          onPress: () => router.back(),
          variant: 'secondary',
          testID: 'not-found-back-button',
        },
      ]}
    />
  );
}

