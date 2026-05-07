import { authService } from '../auth.service';
import apiClient, { apiClient as client } from '../client';
import { LoginRequest, RegisterRequest, User } from '../types';

// Mock the API client
jest.mock('../client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  const mockApiClient = {
    setAccessToken: jest.fn(() => Promise.resolve()),
    setRefreshToken: jest.fn(() => Promise.resolve()),
    clearTokens: jest.fn(() => Promise.resolve()),
    getAccessToken: jest.fn(() => Promise.resolve(null)),
    isAuthenticated: jest.fn(() => Promise.resolve(false)),
    getInstance: jest.fn(() => mockAxiosInstance),
    getBaseURL: jest.fn(() => 'http://localhost:3000'),
  };

  return {
    __esModule: true,
    default: mockAxiosInstance,
    apiClient: mockApiClient,
  };
});

const mockAxiosInstance = apiClient as jest.Mocked<typeof apiClient>;
const mockClient = client as jest.Mocked<typeof client>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    status: 'active',
    timezone: 'UTC',
    language: 'en',
    emailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockTokens = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
  };

  describe('login', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('logs in successfully and returns auth response', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({ data: mockTokens })
      ;
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: mockUser })
      ;

      const result = await authService.login(loginData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/login',
        loginData
      );
      expect(mockClient.setAccessToken).toHaveBeenCalledWith(mockTokens.accessToken);
      expect(mockClient.setRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.user).toEqual(mockUser);
    });

    it('stores tokens after successful login', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      await authService.login(loginData);

      expect(mockClient.setAccessToken).toHaveBeenCalledTimes(1);
      expect(mockClient.setRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('throws on invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('throws on network error during login', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.login(loginData)).rejects.toThrow('Network error');
    });

    it('throws if fetching user profile fails after login', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      const error = new Error('Failed to fetch user');
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(authService.login(loginData)).rejects.toThrow('Failed to fetch user');
    });

    it('returns user object with correct fields', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      const result = await authService.login(loginData);

      expect(result.user.id).toBe('user1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('user');
    });
  });

  describe('register', () => {
    const registerData: RegisterRequest = {
      email: 'new@example.com',
      password: 'securepass123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('registers a new user and returns auth response', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      const result = await authService.register(registerData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/register',
        registerData
      );
      expect(mockClient.setAccessToken).toHaveBeenCalledWith(mockTokens.accessToken);
      expect(mockClient.setRefreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.user).toEqual(mockUser);
    });

    it('stores tokens after successful registration', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      await authService.register(registerData);

      expect(mockClient.setAccessToken).toHaveBeenCalledTimes(1);
      expect(mockClient.setRefreshToken).toHaveBeenCalledTimes(1);
    });

    it('fetches user profile after registration', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTokens });
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUser });

      await authService.register(registerData);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
    });

    it('throws on duplicate email registration', async () => {
      const error = new Error('Email already in use');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.register(registerData)).rejects.toThrow('Email already in use');
    });

    it('throws on validation error', async () => {
      const error = new Error('Validation failed: password is too short');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.register(registerData)).rejects.toThrow('Validation failed');
    });
  });

  describe('logout', () => {
    it('calls logout endpoint and clears tokens', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await authService.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockClient.clearTokens).toHaveBeenCalledTimes(1);
    });

    it('clears tokens even if logout endpoint fails (error still propagates)', async () => {
      const error = new Error('Server error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      // try/finally: clearTokens runs but the error still propagates
      await expect(authService.logout()).rejects.toThrow('Server error');
      expect(mockClient.clearTokens).toHaveBeenCalledTimes(1);
    });

    it('clears tokens even on network error (error still propagates)', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.logout()).rejects.toThrow('Network error');
      expect(mockClient.clearTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('forgotPassword', () => {
    it('sends forgot password request with email', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await authService.forgotPassword('user@example.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/forgot-password',
        { email: 'user@example.com' }
      );
    });

    it('throws on unknown email', async () => {
      const error = new Error('Email not found');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.forgotPassword('unknown@example.com')).rejects.toThrow('Email not found');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.forgotPassword('user@example.com')).rejects.toThrow('Network error');
    });
  });

  describe('resetPassword', () => {
    it('sends reset password request with token and new password', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await authService.resetPassword('reset-token-abc', 'newPassword123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/reset-password',
        { token: 'reset-token-abc', newPassword: 'newPassword123' }
      );
    });

    it('throws on expired token', async () => {
      const error = new Error('Token has expired');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.resetPassword('expired-token', 'newPass123')).rejects.toThrow('Token has expired');
    });

    it('throws on invalid token', async () => {
      const error = new Error('Invalid reset token');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.resetPassword('invalid-token', 'newPass123')).rejects.toThrow('Invalid reset token');
    });
  });

  describe('changePassword', () => {
    it('sends change password request with current and new passwords', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await authService.changePassword('currentPass123', 'newPass456');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/auth/change-password',
        { currentPassword: 'currentPass123', newPassword: 'newPass456' }
      );
    });

    it('throws when current password is wrong', async () => {
      const error = new Error('Current password is incorrect');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.changePassword('wrongPass', 'newPass456')).rejects.toThrow('Current password is incorrect');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.changePassword('currentPass', 'newPass')).rejects.toThrow('Unauthorized');
    });

    it('throws on server error', async () => {
      const error = new Error('Internal server error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(authService.changePassword('pass', 'newpass')).rejects.toThrow('Internal server error');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user has an access token', async () => {
      mockClient.isAuthenticated.mockResolvedValueOnce(true);

      const result = await authService.isAuthenticated();

      expect(mockClient.isAuthenticated).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('returns false when user has no access token', async () => {
      mockClient.isAuthenticated.mockResolvedValueOnce(false);

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('returns the access token when present', async () => {
      mockClient.getAccessToken.mockResolvedValueOnce('access-token-xyz');

      const result = await authService.getAccessToken();

      expect(mockClient.getAccessToken).toHaveBeenCalledTimes(1);
      expect(result).toBe('access-token-xyz');
    });

    it('returns null when no access token is stored', async () => {
      mockClient.getAccessToken.mockResolvedValueOnce(null);

      const result = await authService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('clears all authentication tokens', async () => {
      await authService.clearAuth();

      expect(mockClient.clearTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('handles server 500 error on login', async () => {
      const error = new Error('Internal server error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(
        authService.login({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Internal server error');
    });

    it('handles timeout error on register', async () => {
      const error = new Error('Request timeout');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'pass',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('Request timeout');
    });
  });
});
