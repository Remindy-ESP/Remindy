import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { toast } from '@/context/ToastContext';
import { showConfirm } from '@/context/ConfirmContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';

type MenuItemProps = {
  testID: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function MenuItem({ testID, icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={18} color="#C9CCF4" />
        </View>
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8E93B7" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: t('profile.logout.confirmTitle'),
      message: t('profile.logout.confirmMessage'),
      confirmText: t('profile.logout.button'),
      cancelText: t('profile.logout.cancel'),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader
        title={t('profile.sections.settings')}
        subtitle={t('profile.preferences.subtitle')}
        testID="settings-back-button"
      />

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('profile.sections.settings')}</Text>

        <MenuItem
          testID="settings-notifications-item"
          icon="notifications-outline"
          label={t('profile.menu.notifications')}
          onPress={() => router.push('/(stack)/profile-notifications' as any)}
        />
        <MenuItem
          testID="settings-preferences-item"
          icon="settings-outline"
          label={t('profile.menu.preferences')}
          onPress={() => router.push('/(stack)/profile-preferences' as any)}
        />
        <MenuItem
          testID="settings-security-item"
          icon="shield-checkmark-outline"
          label={t('profile.menu.security')}
          onPress={() => router.push('/(stack)/profile-security' as any)}
        />
        <MenuItem
          testID="settings-privacy-item"
          icon="lock-closed-outline"
          label={t('profile.menu.privacy')}
          onPress={() => router.push('/(stack)/profile-privacy' as any)}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('profile.sections.support')}</Text>

        <MenuItem
          testID="settings-help-item"
          icon="help-circle-outline"
          label={t('profile.menu.help')}
          onPress={() => router.push('/(stack)/profile-help' as any)}
        />
        <MenuItem
          testID="settings-about-item"
          icon="information-circle-outline"
          label={t('profile.menu.about')}
          onPress={() => router.push('/(stack)/profile-about' as any)}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        testID="settings-logout-button"
        disabled={loggingOut}
        activeOpacity={0.85}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>{t('profile.logout.button')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#373848',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8BBD6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1F2140',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 6,
    backgroundColor: '#D94A58',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    backgroundColor: '#777B99',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
