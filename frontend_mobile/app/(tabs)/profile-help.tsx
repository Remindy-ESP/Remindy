import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import onboardingService from '@/services/local/onboarding.service';
import { useCoachMarks } from '@/features/coach-marks/CoachMarksContext';
import Toast from 'react-native-toast-message';

export default function ProfileHelpScreen() {
  const router = useRouter();
  const [resettingGuide, setResettingGuide] = useState(false);
  const { startTour } = useCoachMarks();

  const handleOpenGuide = () => {
    startTour();
    router.push('/(tabs)/dashboard');
  };

  const handleResetGuide = async () => {
    if (resettingGuide) {
      return;
    }

    try {
      setResettingGuide(true);
      await onboardingService.resetOnboarding();
      Toast.show({ type: 'success', text1: 'Guide réinitialisé', text2: 'Il sera proposé à nouveau à la prochaine ouverture.' });
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de réinitialiser le guide.' });
    } finally {
      setResettingGuide(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Aide</Text>
          <Text style={styles.headerSubtitle}>Comment utiliser l application</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guide interactif</Text>
        <Text style={styles.cardDescription}>
          Lancez le guide pour decouvrir les principales fonctionnalites de Remindy.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleOpenGuide}
          activeOpacity={0.8}
          testID="open-guide-button"
        >
          <Ionicons name="map-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Lancer le guide</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reinitialisation</Text>
        <Text style={styles.cardDescription}>
          Si vous souhaitez revoir le guide d introduction qui s affiche au premier lancement.
        </Text>
        <TouchableOpacity
          style={[styles.secondaryButton, resettingGuide && styles.buttonDisabled]}
          onPress={() => void handleResetGuide()}
          disabled={resettingGuide}
          activeOpacity={0.8}
          testID="reset-guide-button"
        >
          {resettingGuide ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.secondaryButtonText}>Reinitialiser le guide</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Besoin d aide ?</Text>
        <Text style={styles.helpDescription}>
          Consultez notre site web ou contactez notre support technique.
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(tabs)/profile-about' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkButtonText}>Nous contacter</Text>
          <Ionicons name="arrow-forward" size={16} color="#AEB7FF" />
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
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#D3D6E8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#4E5498',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    marginTop: 8,
  },
  helpTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  helpDescription: {
    color: '#B8BBD6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkButtonText: {
    color: '#AEB7FF',
    fontSize: 14,
    fontWeight: '700',
  },
});
