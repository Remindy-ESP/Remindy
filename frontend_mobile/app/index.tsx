import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../constants/config';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
      });
      if (response.ok) {
        const data = await response.json();
        await signIn(data.accessToken || data.token || 'dummy_token'); // Adapt to actual response structure
        Alert.alert('Succès', 'Connexion reussie');
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Erreur', 'Connexion echouée, verifiez vos identifiants');
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Erreur de connexion: ${error.message}`);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword || password == '') {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });
      if (response.ok) {
        Alert.alert('Succès', 'Compte créé avec succès, veuillez vous connecter');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
      } else {
        const data = await response.json();
        const message = Array.isArray(data.message) ? data.message.join('\n') : data.message || "Erreur lors de l'inscription";
        Alert.alert('Erreur', message);
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Erreur de connexion: ${error.message}`);
    }
  };

  const handleAuth = async () => {
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Remindy</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Bienvenue' : 'Créer un compte'}
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                testID="firstname-input"
              />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                testID="lastname-input"
              />
            </>
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="password-input"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              testID="confirm-password-input"
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            testID="submit-button"
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsLogin(!isLogin);
              setPassword('');
            }}
            testID="toggle-auth-mode"
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Pas de compte ? S'inscrire"
                : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
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
});
