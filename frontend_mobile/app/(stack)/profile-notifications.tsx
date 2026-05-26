import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';
import { profileCardStyles as shared } from '@/styles/profileCard';
import { userService } from '@/services/api';
import type { UserPreferences } from '@/services/api/types';

export default function ProfileNotificationsScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setError(null);
      const prefs = await userService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      setError(t('profile.notificationSettings.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchPreferences();
    }, [fetchPreferences])
  );

  const togglePreference = async (key: 'notificationPush' | 'notificationEmail', value: boolean) => {
    if (!preferences) return;

    // Optimistic update
    const prev = { ...preferences };
    setPreferences({ ...preferences, [key]: value });

    try {
      setSaving(true);
      const updated = await userService.updatePreferences({ [key]: value });
      setPreferences(updated);
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
      setPreferences(prev); // Rollback
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScrollView style={shared.container} contentContainerStyle={[shared.contentContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>{t('profile.notificationSettings.loading')}</Text>
      </ScrollView>
    );
  }

  if (error || !preferences) {
    return (
      <ScrollView style={shared.container} contentContainerStyle={[shared.contentContainer, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || t('profile.notificationSettings.loadError')}</Text>
      </ScrollView>
    );
  }

  const channels: {
    key: 'notificationPush' | 'notificationEmail';
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    color: string;
  }[] = [
    {
      key: 'notificationPush',
      icon: 'phone-portrait-outline',
      label: t('profile.notificationSettings.push.label'),
      description: t('profile.notificationSettings.push.description'),
      color: '#6366f1',
    },
    {
      key: 'notificationEmail',
      icon: 'mail-outline',
      label: t('profile.notificationSettings.email.label'),
      description: t('profile.notificationSettings.email.description'),
      color: '#3b82f6',
    },
  ];

  return (
    <ScrollView style={shared.container} contentContainerStyle={shared.contentContainer}>
      <ScreenHeader
        title={t('profile.notificationSettings.title')}
        subtitle={t('profile.notificationSettings.subtitle')}
      />

      <View style={shared.card}>
        <Text style={shared.cardTitle}>{t('profile.notificationSettings.channelsTitle')}</Text>
        <Text style={styles.cardDescription}>{t('profile.notificationSettings.channelsDescription')}</Text>

        {channels.map((channel, index) => (
          <View
            key={channel.key}
            style={[
              styles.channelRow,
              index === channels.length - 1 && styles.channelRowLast,
            ]}
          >
            <View style={styles.channelLeft}>
              <View style={[styles.channelIconWrap, { backgroundColor: channel.color + '20' }]}>
                <Ionicons name={channel.icon} size={20} color={channel.color} />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelLabel}>{channel.label}</Text>
                <Text style={styles.channelDescription}>{channel.description}</Text>
              </View>
            </View>
            <Switch
              testID={`toggle-${channel.key}`}
              value={preferences[channel.key]}
              onValueChange={(val) => togglePreference(channel.key, val)}
              trackColor={{ false: '#3e3e5e', true: channel.color + '80' }}
              thumbColor={preferences[channel.key] ? channel.color : '#888'}
              disabled={saving}
            />
          </View>
        ))}
      </View>

      <View style={shared.card}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color="#8E93B7" />
          <Text style={styles.infoText}>{t('profile.notificationSettings.infoNote')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    color: '#D3D6E8',
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  cardDescription: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  channelRowLast: {
    borderBottomWidth: 0,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  channelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    marginLeft: 12,
    flex: 1,
  },
  channelLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  channelDescription: {
    color: '#8E93B7',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    color: '#8E93B7',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
