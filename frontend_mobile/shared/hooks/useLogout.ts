import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useTranslation } from '@/shared/application/I18nContext';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';

/**
 * Shared logout flow: confirmation + logout + redirect to root.
 * Returns the in-progress flag and the handler to wire on a logout button.
 */
export function useLogout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: t('profile.logout.confirmTitle'),
      message: t('profile.logout.confirmMessage'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      setLoggingOut(true);
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('profile.logout.errorMessage'));
    } finally {
      setLoggingOut(false);
    }
  };

  return { loggingOut, handleLogout };
}
