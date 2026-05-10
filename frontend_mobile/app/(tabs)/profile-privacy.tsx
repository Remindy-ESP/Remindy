import React, { useState } from 'react';
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
import { userService } from '@/services/api';
import Toast from 'react-native-toast-message';

export default function ProfilePrivacyScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await userService.exportData({ format: 'json' });
      Toast.show({ type: 'success', text1: 'Export demandé', text2: `Statut: ${result.status} \u2014 Format: ${result.format}` });
    } catch (error: any) {
      console.error('RGPD export request failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Impossible de demander l'export des donnees.";
      Toast.show({ type: 'error', text1: 'Erreur', text2: String(message) });
    } finally {
      setIsExporting(false);
    }
  };

  const performDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await userService.deleteMe();
      await logout();
      Toast.show({ type: 'success', text1: 'Compte supprimé', text2: 'Votre compte a été supprimé.' });
      router.replace('/');
    } catch (error: any) {
      console.error('Delete account failed:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Impossible de supprimer le compte.';
      Toast.show({ type: 'error', text1: 'Erreur', text2: String(message) });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action efface vos donnees via une suppression de compte (soft delete backend). Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            void performDeleteAccount();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Confidentialite</Text>
          <Text style={styles.headerSubtitle}>Donnees, export et suppression du compte</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gestion des donnees</Text>
        <Text style={styles.cardBody}>
          Vous pouvez demander un export de vos donnees personnelles avant une suppression de compte.
        </Text>

        <TouchableOpacity
          testID="export-data-button"
          style={[styles.actionButton, isExporting && styles.buttonDisabled]}
          onPress={handleExportData}
          disabled={isExporting || isDeleting}
          activeOpacity={0.85}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Exporter mes donnees</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>Zone sensible</Text>
        <Text style={styles.warningBody}>
          La suppression du compte est irreversible cote utilisateur. Le backend applique actuellement une suppression logique.
        </Text>

        <TouchableOpacity
          testID="delete-account-button"
          style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting || isExporting}
          activeOpacity={0.85}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
            </>
          )}
        </TouchableOpacity>
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
    marginBottom: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  actionButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  warningCard: {
    backgroundColor: '#3E2630',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8A4358',
    padding: 16,
  },
  warningTitle: {
    color: '#FFD7DE',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningBody: {
    color: '#FFD7DE',
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  deleteButton: {
    backgroundColor: '#D94A58',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

