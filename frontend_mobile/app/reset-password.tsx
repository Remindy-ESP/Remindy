import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService, getErrorMessage } from '@/services/api';
import { useTranslation } from '@/context/I18nContext';
import { authFormStyles as styles } from '@/styles/authForm';
import FormFeedback from '@/components/FormFeedback';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const queryToken = Array.isArray(params.token) ? params.token[0] : params.token;

  const [token, setToken] = useState(queryToken ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (queryToken) {
      setToken(queryToken);
    }
  }, [queryToken]);

  const handleReset = async () => {
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError(t('auth.reset.tokenRequired'));
      return;
    }

    if (!newPassword) {
      setError(t('auth.reset.newPasswordRequired'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.reset.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.reset.passwordsMismatch'));
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), newPassword);
      setSuccess(t('auth.reset.success'));
      Alert.alert(t('auth.reset.successAlertTitle'), t('auth.reset.successAlertMessage'), [
        {
          text: t('common.ok'),
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(err, t('auth.reset.errorFallback'));
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
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#333', marginBottom: 8, textAlign: 'center' }}>
          {t('auth.reset.title')}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 21 }}>
          {t('auth.reset.subtitle')}
        </Text>

        <FormFeedback error={error} success={success} variant="light" />

        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.tokenPlaceholder')}
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          editable={!loading}
          autoCapitalize="none"
          testID="reset-token-input"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.newPasswordPlaceholder')}
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!loading}
          testID="reset-password-input"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.confirmPlaceholder')}
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          testID="reset-confirm-password-input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => void handleReset()}
          disabled={loading}
          testID="reset-submit-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.reset.submit')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} disabled={loading} testID="reset-login-link">
          <Text style={styles.linkText}>{t('auth.reset.back')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
