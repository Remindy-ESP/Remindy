import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use IP address for mobile device access (not localhost)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.68.241.248:3000';
const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000;

// Storage keys
const ACCESS_TOKEN_KEY = '@remindy_access_token';
const REFRESH_TOKEN_KEY = '@remindy_refresh_token';

/**
 * Base API client with axios
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor - Add auth token to requests
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
              // No refresh token available - user needs to login again
              console.log('[Auth] No refresh token available, clearing auth state');
              await this.clearTokens();
              this.isRefreshing = false;
              // Don't throw error, just reject with 401 so app can redirect to login
              return Promise.reject(error);
            }

            // Call refresh endpoint
            console.log('[Auth] Attempting to refresh access token');
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Store new tokens
            await this.setAccessToken(accessToken);
            if (newRefreshToken) {
              await this.setRefreshToken(newRefreshToken);
            }

            console.log('[Auth] Token refresh successful');

            // Process failed queue
            this.failedQueue.forEach((promise) => {
              promise.resolve();
            });
            this.failedQueue = [];

            // Retry original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and reject all queued requests
            console.error('[Auth] Token refresh failed:', refreshError);
            this.failedQueue.forEach((promise) => {
              promise.reject(refreshError);
            });
            this.failedQueue = [];
            await this.clearTokens();
            this.isRefreshing = false;
            return Promise.reject(error); // Return original error, not refresh error
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the axios instance
   */
  getInstance(): AxiosInstance {
    return this.client;
  }

  /**
   * Token management methods
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      // Don't save null/undefined values
      if (!token) {
        console.warn('Attempted to set null/undefined access token');
        return;
      }
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      // Don't save null/undefined values
      if (!token) {
        console.warn('Attempted to set null/undefined refresh token');
        return;
      }
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting refresh token:', error);
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient.getInstance();
