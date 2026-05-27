import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService, getErrorMessage } from '@/services/api';
import { useTranslation } from '@/shared/application/I18nContext';
import { authFormStyles as styles } from '@/shared/styles/authForm';
import FormFeedback from '@/shared/ui/FormFeedback';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(email.trim());
      setSuccess(t('auth.forgot.successMessage'));
    } catch (err) {
      const message = getErrorMessage(err, t('auth.forgot.errorSend'));
      setError(message);
      Alert.alert(t('common.error'), message);
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
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#f0f0f0', marginBottom: 8, textAlign: 'center' }}>
          {t('auth.forgot.title')}
        </Text>
        <Text style={{ fontSize: 15, color: '#9ca3af', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
          {t('auth.forgot.subtitle')}
        </Text>

        <FormFeedback error={error} success={success} variant="dark" />

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          testID="forgot-email-input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={loading}
          testID="forgot-submit-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.forgot.submit')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          testID="forgot-back-button"
        >
          <Text style={styles.linkText}>{t('auth.forgot.back')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
