import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authService, getErrorMessage } from '@/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
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
      setError('Token de reinitialisation requis');
      return;
    }

    if (!newPassword) {
      setError('Nouveau mot de passe requis');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), newPassword);
      setSuccess('Mot de passe reinitialise avec succes.');
      Alert.alert('Succes', 'Mot de passe reinitialise.', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(err, 'Echec de la reinitialisation du mot de passe.');
      setError(message);
      Alert.alert('Erreur', message);
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
        <Text style={styles.title}>Reinitialiser le mot de passe</Text>
        <Text style={styles.subtitle}>
          Collez le token recu par email ou ouvrez le lien directement depuis votre appareil.
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
          placeholder="Token"
          placeholderTextColor="#999"
          value={token}
          onChangeText={setToken}
          editable={!loading}
          autoCapitalize="none"
          testID="reset-token-input"
        />

        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!loading}
          testID="reset-password-input"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          testID="reset-confirm-password-input"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
          testID="reset-submit-button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reinitialiser</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} disabled={loading} testID="reset-login-link">
          <Text style={styles.linkText}>Retour a la connexion</Text>
        </TouchableOpacity>
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
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 21,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    marginTop: 16,
    color: '#6366f1',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#991b1b',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#166534',
  },
});

