import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService, getErrorMessage } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';
import CoachMarkTarget from '@/components/system/CoachMarkTarget';
import { COACH_MARK_TARGETS } from '@/features/coach-marks/coach-marks.config';
import ScreenHeader from '@/components/ScreenHeader';

export default function ProfileSecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const validateForm = (): string | null => {
    if (!currentPassword) {
      return t('profile.security.validation.currentRequired');
    }

    if (!newPassword) {
      return t('profile.security.validation.newRequired');
    }

    if (newPassword.length < 8) {
      return t('profile.security.validation.newTooShort');
    }

    if (newPassword === currentPassword) {
      return t('profile.security.validation.sameAsOld');
    }

    if (newPassword !== confirmPassword) {
      return t('profile.security.validation.mismatch');
    }

    return null;
  };

  const handleChangePassword = async () => {
    resetMessages();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      setSuccess(t('profile.security.successInline'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('profile.security.successTitle'), t('profile.security.successAlert'));
    } catch (err) {
      const message = getErrorMessage(err, t('profile.security.updateFailed'));
      setError(message);
      Alert.alert(t('profile.security.errorTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <ScreenHeader title={t('profile.security.title')} subtitle={t('profile.security.subtitle')} testID="security-back-button" />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile.security.cardTitle')}</Text>
          <Text style={styles.cardBody}>
            {t('profile.security.cardBody')}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder={t('profile.security.placeholders.current')}
            placeholderTextColor="#9CA0C2"
            secureTextEntry
            value={currentPassword}
            onChangeText={(value) => {
              resetMessages();
              setCurrentPassword(value);
            }}
            editable={!loading}
            testID="current-password-input"
          />

          <TextInput
            style={styles.input}
            placeholder={t('profile.security.placeholders.new')}
            placeholderTextColor="#9CA0C2"
            secureTextEntry
            value={newPassword}
            onChangeText={(value) => {
              resetMessages();
              setNewPassword(value);
            }}
            editable={!loading}
            testID="new-password-input"
          />

          <TextInput
            style={styles.input}
            placeholder={t('profile.security.placeholders.confirm')}
            placeholderTextColor="#9CA0C2"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(value) => {
              resetMessages();
              setConfirmPassword(value);
            }}
            editable={!loading}
            testID="confirm-password-input"
          />

          <CoachMarkTarget targetKey={COACH_MARK_TARGETS.profileSecurityChangePassword}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
              testID="change-password-button"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>{t('profile.security.submit')}</Text>
                </>
              )}
            </TouchableOpacity>
          </CoachMarkTarget>
        </View>

        <View style={styles.secondaryCard}>
          <Text style={styles.secondaryTitle}>{t('profile.security.forgot.title')}</Text>
          <Text style={styles.secondaryBody}>
            {t('profile.security.forgot.body')}
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/forgot-password' as any)}
            testID="security-forgot-button"
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={18} color="#DDE1FF" />
            <Text style={styles.secondaryButtonText}>{t('profile.security.forgot.button')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11112A',
  },
  content: {
    flex: 1,
    padding: 16,
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
  input: {
    backgroundColor: '#1F2140',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4E5498',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#4B4FC9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryCard: {
    backgroundColor: '#1B1D42',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343B78',
    padding: 16,
  },
  secondaryTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  secondaryBody: {
    color: '#C8CBE6',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#2A2F63',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#DDE1FF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#4B242C',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A6475A',
  },
  errorText: {
    color: '#FFD7DE',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: '#1E4732',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3C9B6A',
  },
  successText: {
    color: '#D3FFEA',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
