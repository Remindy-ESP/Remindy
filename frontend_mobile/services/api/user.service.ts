import apiClient from './client';
import { User, UpdateUserRequest } from './types';

/**
 * User Service
 * Handles user profile operations
 */
class UserService {
  private readonly BASE_PATH = '/users';

  /**
   * Get current user profile
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>(`${this.BASE_PATH}/me`);
    return response.data;
  }

  /**
   * Update current user profile
   */
  async updateMe(data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>(`${this.BASE_PATH}/me`, data);
    return response.data;
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<any> {
    const response = await apiClient.get(`${this.BASE_PATH}/me/preferences`);
    return response.data;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: any): Promise<any> {
    const response = await apiClient.put(
      `${this.BASE_PATH}/me/preferences`,
      preferences
    );
    return response.data;
  }

  /**
   * Export user data (RGPD compliance)
   */
  async exportData(): Promise<any> {
    const response = await apiClient.get(`${this.BASE_PATH}/me/export`);
    return response.data;
  }
}

export const userService = new UserService();
export default userService;
