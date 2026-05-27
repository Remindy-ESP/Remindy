import apiClient from '@/shared/infrastructure/apiClient';
import { apiClient as client } from '@/shared/infrastructure/apiClient';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@/services/api/types';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */
class AuthService {
  private readonly BASE_PATH = '/auth';

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      `${this.BASE_PATH}/register`,
      data
    );

    // Store tokens
    await client.setAccessToken(response.data.accessToken);
    await client.setRefreshToken(response.data.refreshToken);

    // Fetch user data after registration
    const userResponse = await apiClient.get<User>('/users/me');

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: userResponse.data,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      `${this.BASE_PATH}/login`,
      data
    );

    // Store tokens
    await client.setAccessToken(response.data.accessToken);
    await client.setRefreshToken(response.data.refreshToken);

    // Fetch user data after login
    const userResponse = await apiClient.get<User>('/users/me');

    return {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: userResponse.data,
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_PATH}/logout`);
    } finally {
      // Clear tokens regardless of API response
      await client.clearTokens();
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post(`${this.BASE_PATH}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.BASE_PATH}/reset-password`, {
      token,
      newPassword,
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.BASE_PATH}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await client.isAuthenticated();
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    return await client.getAccessToken();
  }

  /**
   * Clear all authentication data
   */
  async oauthApple(data: {
    identityToken: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      `${this.BASE_PATH}/oauth/apple`,
      data,
    );
    return response.data;
  }

  async clearAuth(): Promise<void> {
    await client.clearTokens();
  }
}

export const authService = new AuthService();
export default authService;
