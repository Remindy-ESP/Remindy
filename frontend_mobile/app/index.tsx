import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/I18nContext';
import { getErrorMessage } from '@/services/api';
import onboardingService from '@/services/local/onboarding.service';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const {
    login,
    register,
    isAuthenticated,
    isLoading: authLoading,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
  } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    void (async () => {
      const seen = await onboardingService.hasSeenOnboarding();
      if (!seen) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)/dashboard');
      }
    })();
  }, [isAuthenticated, authLoading]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): string | null => {
    if (!email.trim()) {
      return t('validation.emailRequired');
    }

    if (!validateEmail(email)) {
      return t('validation.emailInvalid');
    }

    if (!password) {
      return t('validation.passwordRequired');
    }

    if (password.length < 6) {
      return t('validation.passwordMinLength');
    }

    if (!isLogin) {
      if (!firstName.trim()) {
        return t('validation.firstNameRequired');
      }

      if (!lastName.trim()) {
        return t('validation.lastNameRequired');
      }

      if (!confirmPassword) {
        return t('validation.confirmPasswordRequired');
      }

      if (password !== confirmPassword) {
        return t('validation.passwordsMismatch');
      }
    }

    return null;
  };

  const handleAuth = async () => {
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, firstName.trim(), lastName.trim());
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorMessage = getErrorMessage(
        err,
        isLogin ? t('auth.loginRetry') : t('auth.registrationRetry'),
      );

      setError(errorMessage);
      Alert.alert(
        isLogin ? t('auth.loginFailed') : t('auth.registrationFailed'),
        errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMessage = getErrorMessage(err, t('auth.loginRetry'));
      setError(errorMessage);
      Alert.alert(t('auth.loginFailed'), errorMessage);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    try {
      await loginWithMicrosoft();
    } catch (err: any) {
      console.error('Microsoft login error:', err);
      const errorMessage = getErrorMessage(err, t('auth.loginRetry'));
      setError(errorMessage);
      Alert.alert(t('auth.loginFailed'), errorMessage);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error('Apple login error:', err);
      const errorMessage = getErrorMessage(err, t('auth.loginRetry'));
      setError(errorMessage);
      Alert.alert(t('auth.loginFailed'), errorMessage);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ marginTop: 16, color: '#666' }}>{t('auth.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? t('auth.welcome') : t('auth.createAccount')}
        </Text>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('auth.firstName')}
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                testID="firstName-input"
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder={t('auth.lastName')}
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                testID="lastName-input"
                editable={!loading}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="password-input"
            editable={!loading}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              testID="confirm-password-input"
              editable={!loading}
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            testID="submit-button"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? t('auth.signIn') : t('auth.signUp')}
              </Text>
            )}
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              onPress={() => router.push('/forgot-password' as any)}
              testID="forgot-password-link"
              disabled={loading}
            >
              <Text style={[styles.forgotText, loading && styles.toggleTextDisabled]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            testID="toggle-auth-mode"
            disabled={loading}
          >
            <Text style={[styles.toggleText, loading && styles.toggleTextDisabled]}>
              {isLogin ? t('auth.toggleToRegister') : t('auth.toggleToLogin')}
            </Text>
          </TouchableOpacity>

          {/* OAuth section */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou continuer avec</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.oauthButton} onPress={handleGoogleLogin} testID="google-login-button">
            <Text style={styles.oauthButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.oauthButton} onPress={handleMicrosoftLogin} testID="microsoft-login-button">
            <Text style={styles.oauthButtonText}>Microsoft</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#6366f1',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  forgotText: {
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextDisabled: {
    color: '#9ca3af',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#9ca3af',
  },
  oauthButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  appleButton: {
    height: 50,
    marginBottom: 12,
  },
});
