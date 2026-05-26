import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { authService, userService, apiClient, type User } from '@/services/api';
import i18n from '@/i18n';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Expo Go doesn't support custom URI schemes — use the Expo auth proxy instead.
// In a dev/prod build, expo-auth-session resolves the redirect URI natively.
const GOOGLE_REDIRECT_URI = IS_EXPO_GO
  ? 'https://auth.expo.io/@remindy/frontend_mobile'
  : undefined;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google OAuth hook — must be called at top level.
  // expo-auth-session v7 requires androidClientId to be a non-empty string on Android;
  // fall back to a placeholder so the hook never throws when env vars are absent.
  // In Expo Go, force the Expo proxy URI — the local exp:// URI is rejected by Google.
  const [, , googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'not_configured',
    scopes: ['profile', 'email'],
    ...(GOOGLE_REDIRECT_URI ? { redirectUri: GOOGLE_REDIRECT_URI } : {}),
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    apiClient.setOnAuthFailure(() => {
      setUser(null);
      setToken(null);
      Alert.alert(i18n.t('auth.session.expiredTitle'), i18n.t('auth.session.expiredMessage'));
    });
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.isAuthenticated();

      if (isAuth) {
        const userData = await userService.getMe();
        const accessToken = await authService.getAccessToken();
        setUser(userData);
        setToken(accessToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setToken(null);
      await authService.clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setToken(response.accessToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      const response = await authService.register({ email, password, firstName, lastName });
      setUser(response.user);
      setToken(response.accessToken);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await userService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const loginWithGoogle = useCallback(async () => {
    const result = await googlePromptAsync();
    if (result.type !== 'success') throw new Error('Google login cancelled');
    const idToken =
      (result.params as any)?.id_token ?? (result.authentication as any)?.idToken;
    if (!idToken) throw new Error('No Google ID token');
    const { data } = await axios.post(`${API_URL}/auth/oauth/google`, { idToken });
    await apiClient.setAccessToken(data.accessToken);
    if (data.refreshToken) await apiClient.setRefreshToken(data.refreshToken);
    const userData = await userService.getMe();
    setUser(userData);
    setToken(data.accessToken);
  }, [googlePromptAsync]);

  const loginWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign In is only available on iOS');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('No Apple identity token');
    const { data } = await axios.post(`${API_URL}/auth/oauth/apple`, {
      identityToken: credential.identityToken,
      email: credential.email ?? undefined,
      firstName: credential.fullName?.givenName ?? undefined,
      lastName: credential.fullName?.familyName ?? undefined,
    });
    await apiClient.setAccessToken(data.accessToken);
    if (data.refreshToken) await apiClient.setRefreshToken(data.refreshToken);
    const userData = await userService.getMe();
    setUser(userData);
    setToken(data.accessToken);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    loginWithGoogle,
    loginWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
