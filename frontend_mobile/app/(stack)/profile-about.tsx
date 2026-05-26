import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@remindy.com';

export default function ProfileAboutScreen() {
  const { t } = useTranslation();

  const handleContactPress = async () => {
    const emailUrl = `mailto:${SUPPORT_EMAIL}`;
    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (!canOpen) {
        Alert.alert(
          t('profile.about.emailUnavailableTitle'),
          t('profile.about.emailUnavailableMessage', { email: SUPPORT_EMAIL }),
        );
        return;
      }
      await Linking.openURL(emailUrl);
    } catch {
      Alert.alert(
        t('profile.about.emailErrorTitle'),
        t('profile.about.emailErrorMessage', { email: SUPPORT_EMAIL }),
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader title={t('profile.about.title')} subtitle={t('profile.about.subtitle')} />

      <View style={styles.card}>
        <Text style={styles.appName}>{t('profile.about.appName')}</Text>
        <Text style={styles.appDescription}>
          {t('profile.about.description')}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.about.versionLabel')}</Text>
          <Text style={styles.infoValue}>{APP_VERSION}</Text>
        </View>

        <View style={[styles.infoRow, styles.lastRow]}>
          <Text style={styles.infoLabel}>{t('profile.about.contactLabel')}</Text>
          <TouchableOpacity onPress={() => void handleContactPress()} testID="about-support-email-button">
            <Text style={styles.linkValue}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#373848',
    borderRadius: 16,
    padding: 16,
  },
  appName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  appDescription: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  infoLabel: {
    color: '#B8BBD6',
    fontSize: 13,
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  linkValue: {
    color: '#AEB7FF',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
