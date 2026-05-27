import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useTranslation } from '@/shared/application/I18nContext';

/**
 * Shared logout flow: confirmation alert + logout + redirect to root.
 * Returns the in-progress flag and the handler to wire on a logout button.
 */
export function useLogout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('profile.logout.confirmTitle'), t('profile.logout.confirmMessage'), [
      {
        text: t('profile.logout.cancel'),
        style: 'cancel',
      },
      {
        text: t('profile.logout.button'),
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(t('profile.logout.errorTitle'), t('profile.logout.errorMessage'));
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return { loggingOut, handleLogout };
}
