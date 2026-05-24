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
import { useTranslation } from '@/context/I18nContext';
import ScreenHeader from '@/components/ScreenHeader';

export default function ProfileHelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [resettingGuide, setResettingGuide] = useState(false);
  const { startTour } = useCoachMarks();

  const handleOpenGuide = () => {
    startTour();
    router.push('/(tabs)/dashboard');
  };

  const handleResetGuide = async () => {
    if (resettingGuide) return;
    try {
      setResettingGuide(true);
      await onboardingService.resetOnboarding();
      Alert.alert(t('profile.help.guide.resetSuccessTitle'), t('profile.help.guide.resetSuccessMessage'));
    } catch {
      Alert.alert(t('profile.help.guide.resetErrorTitle'), t('profile.help.guide.resetErrorMessage'));
    } finally {
      setResettingGuide(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ScreenHeader title={t('profile.help.title')} subtitle={t('profile.help.subtitle')} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.help.guide.title')}</Text>
        <Text style={styles.cardBody}>{t('profile.help.guide.body')}</Text>

        <TouchableOpacity
          testID="open-onboarding-guide-button"
          style={styles.primaryButton}
          onPress={handleOpenGuide}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{t('profile.help.guide.openButton')}</Text>
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
              <Text style={styles.secondaryButtonText}>{t('profile.help.guide.resetButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.help.support.title')}</Text>
        <Text style={styles.cardBody}>{t('profile.help.support.body')}</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(stack)/support-new')}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{t('profile.help.support.newButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(stack)/support-tickets')}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={18} color="#DDE1FF" />
          <Text style={styles.secondaryButtonText}>{t('profile.help.support.myTicketsButton')}</Text>
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
