import apiClient from '@/shared/infrastructure/apiClient';
import {
  User,
  UpdateUserRequest,
  RequestRgpdExport,
  RgpdExportResponse,
  UploadUserPhotoFile,
  UserPreferences,
  UpdateUserPreferencesRequest,
} from '@/services/api/types';

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

  async uploadMyPhoto(file: UploadUserPhotoFile): Promise<User> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post<User>(`${this.BASE_PATH}/me/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deleteMyPhoto(): Promise<User> {
    const response = await apiClient.delete<User>(`${this.BASE_PATH}/me/photo`);
    return response.data;
  }

  /**
   * Delete current user account
   */
  async deleteMe(): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/me`);
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>(`${this.BASE_PATH}/preferences`);
    return response.data;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    const response = await apiClient.put<UserPreferences>(
      `${this.BASE_PATH}/preferences`,
      preferences
    );
    return response.data;
  }

  /**
   * Export user data (RGPD compliance)
   */
  async exportData(data?: RequestRgpdExport): Promise<RgpdExportResponse> {
    const exportParams: RequestRgpdExport = data ?? { format: 'json' };
    const response = await apiClient.post<RgpdExportResponse>(
      `${this.BASE_PATH}/export-data`,
      exportParams
    );
    return response.data;
  }
}

export const userService = new UserService();
export default userService;
