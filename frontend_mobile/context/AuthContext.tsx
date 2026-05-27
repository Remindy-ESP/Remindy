import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { toast } from '@/context/ToastContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authService, userService, apiClient, type User } from '@/services/api';
import i18n from '@/i18n';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

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

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    apiClient.setOnAuthFailure(() => {
      setUser(null);
      setToken(null);
      toast.error(i18n.t('auth.session.expiredMessage'));
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
    } catch (error: any) {
      // 401 is already handled by the axios interceptor (token refresh / onAuthFailure callback)
      // Only log truly unexpected errors to avoid red noise during normal session expiry
      if (error?.response?.status !== 401) {
        console.error('Auth check failed:', error);
      }
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
    const returnUrl = Linking.createURL('oauth');
    const initUrl = `${API_URL}/auth/oauth/google/mobile?returnUrl=${encodeURIComponent(returnUrl)}`;
    const result = await WebBrowser.openAuthSessionAsync(initUrl, returnUrl);
    if (result.type !== 'success') throw new Error('Google login cancelled');
    const parsed = Linking.parse(result.url);
    const accessToken = parsed.queryParams?.accessToken as string | undefined;
    const refreshToken = parsed.queryParams?.refreshToken as string | undefined;
    const error = parsed.queryParams?.error as string | undefined;
    if (error) throw new Error(`Google login failed: ${error}`);
    if (!accessToken) throw new Error('No access token received');
    await apiClient.setAccessToken(accessToken);
    if (refreshToken) await apiClient.setRefreshToken(refreshToken);
    const userData = await userService.getMe();
    setUser(userData);
    setToken(accessToken);
  }, []);

  const loginWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') throw new Error('Apple Sign In is only available on iOS');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('No Apple identity token');
    const result = await authService.oauthApple({
      identityToken: credential.identityToken,
      email: credential.email ?? undefined,
      firstName: credential.fullName?.givenName ?? undefined,
      lastName: credential.fullName?.familyName ?? undefined,
    });
    await apiClient.setAccessToken(result.accessToken);
    if (result.refreshToken) await apiClient.setRefreshToken(result.refreshToken);
    const userData = await userService.getMe();
    setUser(userData);
    setToken(result.accessToken);
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
