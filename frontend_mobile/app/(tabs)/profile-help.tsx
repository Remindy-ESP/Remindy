import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
      Alert.alert('Guide reinitialise', 'Le guide sera propose a nouveau a l ouverture de l application.');
    } catch {
      Alert.alert('Erreur', 'Impossible de reinitialiser le guide pour le moment.');
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
          <Text style={styles.headerSubtitle}>Guide utilisateur et assistance rapide</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Guide de prise en main</Text>
        <Text style={styles.cardBody}>
          Retrouvez les principales fonctionnalites de Remindy : dashboard, abonnements, cloud,
          promotions et securite, avec surbrillance des zones importantes directement dans l app.
        </Text>

        <TouchableOpacity
          testID="open-onboarding-guide-button"
          style={styles.primaryButton}
          onPress={handleOpenGuide}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Voir le guide interactif</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="reset-onboarding-guide-button"
          style={[styles.secondaryButton, resettingGuide && styles.buttonDisabled]}
          onPress={() => void handleResetGuide()}
          disabled={resettingGuide}
          activeOpacity={0.85}
        >
          {resettingGuide ? (
            <ActivityIndicator color="#DDE1FF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#DDE1FF" />
              <Text style={styles.secondaryButtonText}>Reinitialiser le guide de bienvenue</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support</Text>
        <Text style={styles.cardBody}>
          En cas de probleme, consultez la page A propos pour contacter le support ou reessayez
          depuis les actions de l application.
        </Text>
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
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1F2140',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4E5498',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#DDE1FF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
