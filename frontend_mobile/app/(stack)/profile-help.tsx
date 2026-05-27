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
import { useTranslation } from '@/context/I18nContext';
import { toast } from '@/context/ToastContext';
import ScreenHeader from '@/components/ScreenHeader';
import { profileCardStyles as shared } from '@/styles/profileCard';

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
      toast.success(t('profile.help.guide.resetSuccessMessage'));
    } catch {
      toast.error(t('profile.help.guide.resetErrorMessage'));
    } finally {
      setResettingGuide(false);
    }
  };

  return (
    <ScrollView style={shared.container} contentContainerStyle={shared.contentContainer}>
      <ScreenHeader title={t('profile.help.title')} subtitle={t('profile.help.subtitle')} />

      <View style={shared.card}>
        <Text style={shared.cardTitle}>{t('profile.help.guide.title')}</Text>
        <Text style={shared.cardBody}>{t('profile.help.guide.body')}</Text>

        <TouchableOpacity
          testID="open-onboarding-guide-button"
          style={shared.primaryButton}
          onPress={handleOpenGuide}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={18} color="#fff" />
          <Text style={shared.primaryButtonText}>{t('profile.help.guide.openButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="reset-onboarding-guide-button"
          style={[styles.secondaryButton, resettingGuide && shared.buttonDisabled]}
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

      <View style={shared.card}>
        <Text style={shared.cardTitle}>{t('profile.help.support.title')}</Text>
        <Text style={shared.cardBody}>{t('profile.help.support.body')}</Text>

        <TouchableOpacity
          style={shared.primaryButton}
          onPress={() => router.push('/(stack)/support-new')}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={shared.primaryButtonText}>{t('profile.help.support.newButton')}</Text>
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
});
