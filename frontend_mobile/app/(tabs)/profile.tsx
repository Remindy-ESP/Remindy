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
import { useAuth } from '@/context/AuthContext';

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

type InfoRowProps = {
  label: string;
  value?: string | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value && value.trim() ? value : '-'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Deconnexion', 'Etes-vous sur de vouloir vous deconnecter ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Deconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logout();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Erreur', 'Echec de la deconnexion. Veuillez reessayer.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const userName = useMemo(() => {
    if (!user) {
      return 'Utilisateur';
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || 'Utilisateur';
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return '?';

    const firstInitial = user.firstName?.[0]?.toUpperCase() || '';
    const lastInitial = user.lastName?.[0]?.toUpperCase() || '';

    return `${firstInitial}${lastInitial}` || '?';
  }, [user]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{user?.email || 'utilisateur@remindy.com'}</Text>

        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{user?.role || 'user'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <TouchableOpacity
            testID="edit-profile-item"
            style={styles.editButton}
            onPress={() => router.push('/(tabs)/profile-edit')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#E5E7FF" />
            <Text style={styles.editButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>

        <InfoRow label="Prenom" value={user?.firstName} />
        <InfoRow label="Nom" value={user?.lastName} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Telephone" value={user?.phone} />
        <InfoRow label="Langue" value={user?.language} />
        <InfoRow label="Fuseau horaire" value={user?.timezone} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Parametres</Text>

        <MenuItem
          testID="notifications-item"
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push('/(tabs)/notifications')}
        />
        <MenuItem
          testID="preferences-item"
          icon="settings-outline"
          label="Preferences"
          onPress={() => router.push('/(tabs)/profile-preferences')}
        />
        <MenuItem
          testID="privacy-item"
          icon="lock-closed-outline"
          label="Confidentialite"
          onPress={() => router.push('/(tabs)/profile-privacy')}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support</Text>

        <MenuItem
          testID="help-item"
          icon="help-circle-outline"
          label="Aide"
          onPress={() => router.push('/(tabs)/profile-help')}
        />
        <MenuItem
          testID="about-item"
          icon="information-circle-outline"
          label="A propos"
          onPress={() => router.push('/(tabs)/profile-about')}
        />
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
            <Text style={styles.logoutButtonText}>Deconnexion</Text>
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
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
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
