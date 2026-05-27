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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService, getErrorMessage } from '@/services/api';
import { useTranslation } from '@/shared/application/I18nContext';
import { authFormStyles as styles } from '@/shared/styles/authForm';
import FormFeedback from '@/shared/ui/FormFeedback';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const queryToken = Array.isArray(params.token) ? params.token[0] : params.token;

  const [token, setToken] = useState(queryToken ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#f0f0f0', marginBottom: 8, textAlign: 'center' }}>
          {t('auth.reset.title')}
        </Text>
        <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginBottom: 20, lineHeight: 21 }}>
          {t('auth.reset.subtitle')}
        </Text>

        <FormFeedback error={error} success={success} variant="dark" />

        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.tokenPlaceholder')}
          placeholderTextColor="#6b7280"
          value={token}
          onChangeText={setToken}
          editable={!loading}
          autoCapitalize="none"
          testID="reset-token-input"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.reset.newPasswordPlaceholder')}
            placeholderTextColor="#6b7280"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            editable={!loading}
            testID="reset-password-input"
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(v => !v)}>
            <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.reset.confirmPlaceholder')}
            placeholderTextColor="#6b7280"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
            testID="reset-confirm-password-input"
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(v => !v)}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

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
