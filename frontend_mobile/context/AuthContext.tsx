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
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { authService, userService, apiClient, type User } from '@/services/api';
import i18n from '@/i18n';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

const MICROSOFT_DISCOVERY = {
  authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

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
  loginWithMicrosoft: () => Promise<void>;
  loginWithApple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google OAuth hook — must be called at top level
  const [, , googlePromptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Microsoft OAuth hook — must be called at top level
  const [, , msPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? '',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'remindy' }),
    },
    MICROSOFT_DISCOVERY,
  );

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

  const loginWithMicrosoft = useCallback(async () => {
    const result = await msPromptAsync();
    if (result.type !== 'success') throw new Error('Microsoft login cancelled');
    const accessToken =
      (result.params as any)?.access_token ?? (result.authentication as any)?.accessToken;
    if (!accessToken) throw new Error('No Microsoft access token');
    const { data } = await axios.post(`${API_URL}/auth/oauth/microsoft`, { accessToken });
    await apiClient.setAccessToken(data.accessToken);
    if (data.refreshToken) await apiClient.setRefreshToken(data.refreshToken);
    const userData = await userService.getMe();
    setUser(userData);
    setToken(data.accessToken);
  }, [msPromptAsync]);

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
    loginWithMicrosoft,
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
