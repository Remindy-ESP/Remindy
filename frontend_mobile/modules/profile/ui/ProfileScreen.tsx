import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/modules/auth/application/AuthContext';
import { useTranslation } from '@/shared/application/I18nContext';
import UserAvatar from '@/modules/profile/ui/UserAvatar';
import ScreenHeader from '@/shared/ui/ScreenHeader';
import { formatRoleLabel } from '@/utils/role';


type InfoRowProps = Readonly<{
  label: string;
  value?: string | null;
}>;

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value?.trim() ? value : '-'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
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

  const fallbackUserName = t('profile.fallbackUserName');

  const userName = useMemo(() => {
    if (!user) {
      return fallbackUserName;
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || fallbackUserName;
  }, [user, fallbackUserName]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader
        title={t('profile.sections.profile')}
        testID="profile-back-button"
      />

      <View style={styles.heroCard}>
        <UserAvatar
          testID="profile-hero-avatar"
          firstName={user?.firstName}
          lastName={user?.lastName}
          photoUrl={user?.photoUrl}
          size={88}
        />

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{user?.email || t('profile.fallbackEmail')}</Text>

        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>
            {formatRoleLabel(user?.role) || t('profile.fallbackRole')}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.sections.profile')}</Text>
          <TouchableOpacity
            testID="edit-profile-item"
            style={styles.editButton}
            onPress={() => router.push('/(stack)/profile-edit' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#E5E7FF" />
            <Text style={styles.editButtonText}>{t('profile.editButton')}</Text>
          </TouchableOpacity>
        </View>

        <InfoRow label={t('profile.infoLabels.firstName')} value={user?.firstName} />
        <InfoRow label={t('profile.infoLabels.lastName')} value={user?.lastName} />
        <InfoRow label={t('profile.infoLabels.email')} value={user?.email} />
        <InfoRow label={t('profile.infoLabels.phone')} value={user?.phone} />
        <InfoRow label={t('profile.infoLabels.language')} value={user?.language} />
        <InfoRow label={t('profile.infoLabels.timezone')} value={user?.timezone} />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        testID="logout-button"
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#D3D6E8',
  },
  heroCard: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    marginTop: 14,
  },
  email: {
    fontSize: 14,
    color: '#D3D6E8',
    textAlign: 'center',
  },
  rolePill: {
    marginTop: 12,
    backgroundColor: '#1F2140',
    borderColor: '#4E5498',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: {
    color: '#C9CCF4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#373848',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B4FC9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoLabel: {
    color: '#B8BBD6',
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
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
