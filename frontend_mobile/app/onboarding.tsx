import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import onboardingService from '@/services/local/onboarding.service';

type OnboardingStep = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  bullets: string[];
  route: string;
  routeLabel: string;
};

const STEPS: OnboardingStep[] = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    description: 'Vue d ensemble de vos depenses, evenements et actions rapides.',
    icon: 'grid-outline',
    bullets: [
      'Consulter les evenements du jour',
      'Visualiser les categories et periodes',
      'Acces rapide aux actions principales',
    ],
    route: '/(tabs)/dashboard',
    routeLabel: 'Voir le dashboard',
  },
  {
    key: 'subscription',
    title: 'Ajouter un abonnement',
    description: 'Creez vos abonnements, rappels et periodes de facturation facilement.',
    icon: 'add-circle-outline',
    bullets: [
      'Ajouter un abonnement manuellement',
      'Configurer frequence et rappels',
      'Suivre les montants a venir',
    ],
    route: '/(tabs)/subscription',
    routeLabel: 'Voir les abonnements',
  },
  {
    key: 'cloud',
    title: 'Cloud / Documents',
    description: 'Importez et organisez vos documents dans des dossiers.',
    icon: 'cloud-upload-outline',
    bullets: [
      'Uploader PDF et documents',
      'Classer dans des dossiers',
      'Lier des documents aux abonnements',
    ],
    route: '/(tabs)/cloud',
    routeLabel: 'Voir le cloud',
  },
  {
    key: 'promotions',
    title: 'Promotions',
    description: 'Copiez des codes promo et ouvrez directement les sites partenaires.',
    icon: 'pricetags-outline',
    bullets: [
      'Code promo en un clic',
      'Redirection partenaire',
      'Offres visibles dans l onglet Promos',
    ],
    route: '/(tabs)/promotion',
    routeLabel: 'Voir les promos',
  },
  {
    key: 'profile-security',
    title: 'Profil & Securite',
    description: 'Gerez vos preferences, votre compte et la securite.',
    icon: 'shield-checkmark-outline',
    bullets: [
      'Modifier vos informations de profil',
      'Changer votre mot de passe',
      'Acceder a l aide et aux informations app',
    ],
    route: '/(tabs)/profile-security',
    routeLabel: 'Voir la securite',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const step = STEPS[index];
  const isLastStep = index === STEPS.length - 1;
  const fromHelp = from === 'help';

  const progress = useMemo(() => ((index + 1) / STEPS.length) * 100, [index]);

  const finishOnboarding = async (target?: 'home' | 'back') => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      await onboardingService.setHasSeenOnboarding(true);

      if (target === 'back' || fromHelp) {
        router.back();
        return;
      }

      router.replace('/');
    } catch {
      Alert.alert('Erreur', 'Impossible d enregistrer l etat du guide. Veuillez reessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await finishOnboarding(fromHelp ? 'back' : 'home');
  };

  const handleNext = async () => {
    if (saving) {
      return;
    }

    if (isLastStep) {
      await finishOnboarding(fromHelp ? 'back' : 'home');
      return;
    }

    setIndex(current => Math.min(current + 1, STEPS.length - 1));
  };

  const handlePrevious = () => {
    if (saving) {
      return;
    }
    setIndex(current => Math.max(current - 1, 0));
  };

  const handleOpenStepPage = () => {
    router.push(step.route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.stepCounter}>
            {index + 1}/{STEPS.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <Ionicons name={step.icon} size={34} color="#E6E8FF" />
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          <View style={styles.card}>
            {step.bullets.map((bullet, bulletIndex) => (
              <View
                key={`${step.key}-${bulletIndex}`}
                style={[
                  styles.bulletRow,
                  bulletIndex === step.bullets.length - 1 && styles.lastBulletRow,
                ]}
              >
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>

          {fromHelp ? (
            <View style={styles.noticeCard}>
              <Ionicons name="information-circle-outline" size={18} color="#C8CEFF" />
              <Text style={styles.noticeText}>
                Ce guide est ouvert depuis l aide. Vos progres d onboarding restent enregistres.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.ghostButton]}
            onPress={handleOpenStepPage}
            disabled={saving}
            testID="onboarding-open-step-page-button"
            activeOpacity={0.85}
          >
            <Ionicons name="open-outline" size={16} color="#C8CEFF" />
            <Text style={styles.ghostButtonText}>{step.routeLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.secondaryButton]}
            onPress={index === 0 ? handleSkip : handlePrevious}
            disabled={saving}
            testID="onboarding-secondary-button"
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>{index === 0 ? 'Passer' : 'Precedent'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={() => void handleNext()}
            disabled={saving}
            testID="onboarding-primary-button"
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{isLastStep ? 'Terminer' : 'Suivant'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06071D',
  },
  container: {
    flex: 1,
    backgroundColor: '#06071D',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1B1E46',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D3572',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  stepCounter: {
    color: '#C8CDEB',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'right',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1A1E4A',
    borderWidth: 1,
    borderColor: '#313A87',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#BFC4E7',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#111439',
    borderWidth: 1,
    borderColor: '#252D6D',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  lastBulletRow: {
    borderBottomWidth: 0,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8A91FF',
    marginTop: 5,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    color: '#E7E9FB',
    fontSize: 13,
    lineHeight: 19,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#171B45',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3273',
    padding: 10,
  },
  noticeText: {
    flex: 1,
    color: '#C8CEFF',
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  ghostButton: {
    backgroundColor: '#101332',
    borderColor: '#283069',
    flexDirection: 'row',
    gap: 6,
  },
  ghostButtonText: {
    color: '#C8CEFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderColor: '#6366f1',
  },
  secondaryButton: {
    backgroundColor: '#141736',
    borderColor: '#2E356F',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#DDE1FF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
