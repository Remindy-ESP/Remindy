import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const APP_VERSION = '1.0.0';
const SUPPORT_EMAIL = 'support@remindy.com';

export default function ProfileAboutScreen() {
  const router = useRouter();

  const handleContactPress = async () => {
    const emailUrl = `mailto:${SUPPORT_EMAIL}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (!canOpen) {
        Toast.show({ type: 'info', text1: 'Email', text2: `Contactez-nous à ${SUPPORT_EMAIL}` });
        return;
      }

      await Linking.openURL(emailUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur', text2: `Impossible d'ouvrir l'application email. \n${SUPPORT_EMAIL}` });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>A propos</Text>
          <Text style={styles.headerSubtitle}>Informations sur l application</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.appName}>Remindy</Text>
        <Text style={styles.appDescription}>
          Application de suivi des abonnements, rappels et gestion de vos services du quotidien.
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>{APP_VERSION}</Text>
        </View>

        <View style={[styles.infoRow, styles.lastRow]}>
          <Text style={styles.infoLabel}>Contact</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#373848',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#B8BBD6',
    fontSize: 13,
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

