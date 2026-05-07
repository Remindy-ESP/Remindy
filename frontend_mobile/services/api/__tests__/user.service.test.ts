import { userService } from '../user.service';
import apiClient from '../client';
import {
  User,
  UpdateUserRequest,
  RequestRgpdExport,
  RgpdExportResponse,
  UploadUserPhotoFile,
} from '../types';

// Mock the API client
jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33612345678',
    photoUrl: 'https://example.com/photo.jpg',
    role: 'user',
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  describe('getMe', () => {
    it('fetches the current user profile', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const result = await userService.getMe();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });

    it('returns user with all expected fields', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const result = await userService.getMe();

      expect(result.id).toBe('user1');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.role).toBe('user');
      expect(result.emailVerified).toBe(true);
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(error);

      await expect(userService.getMe()).rejects.toThrow('Unauthorized');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(userService.getMe()).rejects.toThrow('Network error');
    });
  });

  describe('updateMe', () => {
    it('updates the current user profile', async () => {
      const updateData: UpdateUserRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        language: 'en',
      };

      const updatedUser: User = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        language: 'en',
      };

      mockApiClient.put.mockResolvedValue({ data: updatedUser });

      const result = await userService.updateMe(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me', updateData);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.language).toBe('en');
    });

    it('updates only phone number', async () => {
      const updateData: UpdateUserRequest = { phone: '+33699887766' };
      const updatedUser: User = { ...mockUser, phone: '+33699887766' };

      mockApiClient.put.mockResolvedValue({ data: updatedUser });

      const result = await userService.updateMe(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/me', updateData);
      expect(result.phone).toBe('+33699887766');
    });

    it('updates timezone', async () => {
      const updateData: UpdateUserRequest = { timezone: 'America/New_York' };
      const updatedUser: User = { ...mockUser, timezone: 'America/New_York' };

      mockApiClient.put.mockResolvedValue({ data: updatedUser });

      const result = await userService.updateMe(updateData);

      expect(result.timezone).toBe('America/New_York');
    });

    it('throws on validation error', async () => {
      const error = new Error('Validation failed: invalid email');
      mockApiClient.put.mockRejectedValue(error);

      await expect(userService.updateMe({ firstName: '' })).rejects.toThrow('Validation failed');
    });

    it('throws on server error', async () => {
      const error = new Error('Internal server error');
      mockApiClient.put.mockRejectedValue(error);

      await expect(userService.updateMe({ firstName: 'Test' })).rejects.toThrow('Internal server error');
    });
  });

  describe('uploadMyPhoto', () => {
    const mockPhotoFile: UploadUserPhotoFile = {
      uri: 'file:///local/photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    };

    it('uploads user photo with FormData', async () => {
      const updatedUser: User = {
        ...mockUser,
        photoUrl: 'https://example.com/new-photo.jpg',
      };

      mockApiClient.post.mockResolvedValue({ data: updatedUser });

      const result = await userService.uploadMyPhoto(mockPhotoFile);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/me/photo',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(updatedUser);
      expect(result.photoUrl).toBe('https://example.com/new-photo.jpg');
    });

    it('sends request with multipart/form-data header', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockUser });

      await userService.uploadMyPhoto(mockPhotoFile);

      const callArgs = mockApiClient.post.mock.calls[0];
      expect(callArgs[2]).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
    });

    it('throws on file too large error', async () => {
      const error = new Error('File size exceeds limit');
      mockApiClient.post.mockRejectedValue(error);

      await expect(userService.uploadMyPhoto(mockPhotoFile)).rejects.toThrow('File size exceeds limit');
    });

    it('throws on unsupported file type', async () => {
      const error = new Error('Unsupported file type');
      mockApiClient.post.mockRejectedValue(error);

      await expect(userService.uploadMyPhoto(mockPhotoFile)).rejects.toThrow('Unsupported file type');
    });
  });

  describe('deleteMyPhoto', () => {
    it('deletes the user photo and returns updated user', async () => {
      const userWithoutPhoto: User = {
        ...mockUser,
        photoUrl: undefined,
        photoR2Key: undefined,
      };

      mockApiClient.delete.mockResolvedValue({ data: userWithoutPhoto });

      const result = await userService.deleteMyPhoto();

      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/me/photo');
      expect(result).toEqual(userWithoutPhoto);
    });

    it('throws on not found error when no photo exists', async () => {
      const error = new Error('Photo not found');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(userService.deleteMyPhoto()).rejects.toThrow('Photo not found');
    });
  });

  describe('deleteMe', () => {
    it('deletes the current user account', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await userService.deleteMe();

      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/me');
    });

    it('throws on unauthorized attempt', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(userService.deleteMe()).rejects.toThrow('Unauthorized');
    });

    it('throws on server error', async () => {
      const error = new Error('Internal server error');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(userService.deleteMe()).rejects.toThrow('Internal server error');
    });
  });

  describe('getPreferences', () => {
    it('fetches user preferences', async () => {
      const mockPreferences = {
        notifications: true,
        theme: 'dark',
        reminderDays: [1, 3, 7],
      };

      mockApiClient.get.mockResolvedValue({ data: mockPreferences });

      const result = await userService.getPreferences();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/preferences');
      expect(result).toEqual(mockPreferences);
    });

    it('returns empty object when no preferences set', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      const result = await userService.getPreferences();

      expect(result).toEqual({});
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(userService.getPreferences()).rejects.toThrow('Network error');
    });
  });

  describe('updatePreferences', () => {
    it('updates user preferences', async () => {
      const preferences = {
        notifications: false,
        theme: 'light',
        reminderDays: [1, 7],
      };

      const updatedPreferences = { ...preferences };

      mockApiClient.put.mockResolvedValue({ data: updatedPreferences });

      const result = await userService.updatePreferences(preferences);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/preferences', preferences);
      expect(result).toEqual(updatedPreferences);
    });

    it('updates single preference field', async () => {
      const preferences = { theme: 'dark' };

      mockApiClient.put.mockResolvedValue({ data: preferences });

      const result = await userService.updatePreferences(preferences);

      expect(result.theme).toBe('dark');
    });

    it('throws on validation error', async () => {
      const error = new Error('Invalid preference value');
      mockApiClient.put.mockRejectedValue(error);

      await expect(userService.updatePreferences({ theme: 'invalid' })).rejects.toThrow('Invalid preference value');
    });
  });

  describe('exportData', () => {
    const mockExportResponse: RgpdExportResponse = {
      id: 'export1',
      userId: 'user1',
      status: 'pending',
      format: 'json',
      requestedBy: 'user',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('requests data export with json format by default', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockExportResponse });

      const result = await userService.exportData();

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/export-data',
        { format: 'json' }
      );
      expect(result).toEqual(mockExportResponse);
    });

    it('requests data export with csv format', async () => {
      const csvExportRequest: RequestRgpdExport = { format: 'csv' };
      const csvExportResponse: RgpdExportResponse = {
        ...mockExportResponse,
        id: 'export2',
        format: 'csv',
      };

      mockApiClient.post.mockResolvedValue({ data: csvExportResponse });

      const result = await userService.exportData(csvExportRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/export-data',
        csvExportRequest
      );
      expect(result.format).toBe('csv');
    });

    it('returns export response with pending status initially', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockExportResponse });

      const result = await userService.exportData({ format: 'json' });

      expect(result.status).toBe('pending');
      expect(result.userId).toBe('user1');
    });

    it('returns export response with signed URL when completed', async () => {
      const completedExport: RgpdExportResponse = {
        ...mockExportResponse,
        status: 'completed',
        signedUrl: 'https://storage.example.com/export.json',
        fileSize: 1024,
        completedAt: '2024-01-01T00:05:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: completedExport });

      const result = await userService.exportData({ format: 'json' });

      expect(result.signedUrl).toBe('https://storage.example.com/export.json');
    });

    it('throws on server error', async () => {
      const error = new Error('Export service unavailable');
      mockApiClient.post.mockRejectedValue(error);

      await expect(userService.exportData()).rejects.toThrow('Export service unavailable');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.post.mockRejectedValue(error);

      await expect(userService.exportData({ format: 'json' })).rejects.toThrow('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('handles network timeout', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(userService.getMe()).rejects.toThrow('Request timeout');
    });

    it('handles 403 forbidden error', async () => {
      const error = new Error('Forbidden');
      mockApiClient.put.mockRejectedValue(error);

      await expect(userService.updateMe({ firstName: 'Test' })).rejects.toThrow('Forbidden');
    });

    it('handles 404 not found error', async () => {
      const error = new Error('User not found');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(userService.deleteMe()).rejects.toThrow('User not found');
    });
  });
});
