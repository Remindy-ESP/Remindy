import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/modules/auth/infrastructure/authApi';
import { userService } from '@/services/api';
import type { User, AuthResponse } from '@/services/api/types';

jest.mock('@/modules/auth/infrastructure/authApi', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getAccessToken: jest.fn(),
    clearAuth: jest.fn(),
    oauthApple: jest.fn(),
  },
}));

jest.mock('@/services/api', () => ({
  userService: {
    getMe: jest.fn(),
  },
  apiClient: {
    setOnAuthFailure: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUserService = userService as jest.Mocked<typeof userService>;

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

const mockAuthResponse: AuthResponse = {
  accessToken: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
  user: mockUser,
};

// Helper component that renders auth state as testable text
function AuthConsumer() {
  const auth = useAuth();
  return (
    <>
      <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
      <Text testID="isLoading">{String(auth.isLoading)}</Text>
      <Text testID="userId">{auth.user?.id ?? 'null'}</Text>
      <Text testID="token">{auth.token ?? 'null'}</Text>
    </>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: not authenticated
    mockAuthService.isAuthenticated.mockResolvedValue(false);
    mockAuthService.clearAuth.mockResolvedValue(undefined);
    mockAuthService.getAccessToken.mockResolvedValue(null);
  });

  describe('initial state — not authenticated', () => {
    it('renders without crashing', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('isLoading').props.children).toBe('false');
      });
    });

    it('sets isAuthenticated to false when no stored session', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
      });
    });

    it('sets user to null when not authenticated', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('userId').props.children).toBe('null');
      });
    });

    it('sets token to null when not authenticated', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('token').props.children).toBe('null');
      });
    });

    it('sets isLoading to false after auth check completes', async () => {
      renderWithProvider();
      await waitFor(() => {
        expect(screen.getByTestId('isLoading').props.children).toBe('false');
      });
    });
  });

  describe('persistent auth state — already authenticated', () => {
    it('restores user and token when a session is stored', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getMe.mockResolvedValue(mockUser);
      mockAuthService.getAccessToken.mockResolvedValue('stored-token');

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('true');
      });
      expect(screen.getByTestId('userId').props.children).toBe('user1');
      expect(screen.getByTestId('token').props.children).toBe('stored-token');
    });

    it('calls userService.getMe when auth check succeeds', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getMe.mockResolvedValue(mockUser);
      mockAuthService.getAccessToken.mockResolvedValue('token');

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading').props.children).toBe('false');
      });
      expect(mockUserService.getMe).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth check failure — clears state', () => {
    it('clears state and calls clearAuth when auth check throws', async () => {
      mockAuthService.isAuthenticated.mockRejectedValue(new Error('Token expired'));

      renderWithProvider();

      await waitFor(() => {
        expect(screen.getByTestId('isLoading').props.children).toBe('false');
      });

      expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
      expect(screen.getByTestId('userId').props.children).toBe('null');
      expect(mockAuthService.clearAuth).toHaveBeenCalledTimes(1);
    });
  });

  describe('login flow', () => {
    it('throws an error when useAuth is called outside AuthProvider', () => {
      // Suppress the console.error from React for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<AuthConsumer />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );
      spy.mockRestore();
    });

    it('sets user and token after successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      let loginFn!: (email: string, password: string) => Promise<void>;

      function LoginConsumer() {
        const auth = useAuth();
        loginFn = auth.login;
        return (
          <>
            <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
            <Text testID="userId">{auth.user?.id ?? 'null'}</Text>
            <Text testID="token">{auth.token ?? 'null'}</Text>
          </>
        );
      }

      render(
        <AuthProvider>
          <LoginConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
      });

      await act(async () => {
        await loginFn('test@example.com', 'password123');
      });

      expect(screen.getByTestId('isAuthenticated').props.children).toBe('true');
      expect(screen.getByTestId('userId').props.children).toBe('user1');
      expect(screen.getByTestId('token').props.children).toBe('access-token-abc');
    });

    it('calls authService.login with correct credentials', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      let loginFn!: (email: string, password: string) => Promise<void>;

      function LoginCapture() {
        const auth = useAuth();
        loginFn = auth.login;
        return <Text testID="noop">noop</Text>;
      }

      render(
        <AuthProvider>
          <LoginCapture />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('noop'));

      await act(async () => {
        await loginFn('user@test.com', 'secret');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'secret',
      });
    });

    it('propagates login errors to the caller', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      let loginFn!: (email: string, password: string) => Promise<void>;

      function ErrorCapture() {
        const auth = useAuth();
        loginFn = auth.login;
        return <Text testID="noop">noop</Text>;
      }

      render(
        <AuthProvider>
          <ErrorCapture />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('noop'));

      await act(async () => {
        await expect(loginFn('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
      });
    });
  });

  describe('logout flow', () => {
    it('clears user and token after logout', async () => {
      // Start already authenticated
      mockAuthService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getMe.mockResolvedValue(mockUser);
      mockAuthService.getAccessToken.mockResolvedValue('stored-token');
      mockAuthService.logout.mockResolvedValue(undefined);

      let logoutFn!: () => Promise<void>;

      function LogoutConsumer() {
        const auth = useAuth();
        logoutFn = auth.logout;
        return (
          <>
            <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
            <Text testID="userId">{auth.user?.id ?? 'null'}</Text>
            <Text testID="token">{auth.token ?? 'null'}</Text>
          </>
        );
      }

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('true');
      });

      await act(async () => {
        await logoutFn();
      });

      expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
      expect(screen.getByTestId('userId').props.children).toBe('null');
      expect(screen.getByTestId('token').props.children).toBe('null');
    });

    it('clears state even when authService.logout API call fails', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getMe.mockResolvedValue(mockUser);
      mockAuthService.getAccessToken.mockResolvedValue('stored-token');
      mockAuthService.logout.mockRejectedValue(new Error('Network error'));

      let logoutFn!: () => Promise<void>;

      function LogoutConsumer() {
        const auth = useAuth();
        logoutFn = auth.logout;
        return (
          <>
            <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
          </>
        );
      }

      render(
        <AuthProvider>
          <LogoutConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('true');
      });

      await act(async () => {
        await logoutFn();
      });

      // State must be cleared even though the API call failed
      expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
    });
  });

  describe('register flow', () => {
    it('sets user and token after successful registration', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      let registerFn!: (
        email: string,
        password: string,
        firstName: string,
        lastName: string
      ) => Promise<void>;

      function RegisterConsumer() {
        const auth = useAuth();
        registerFn = auth.register;
        return (
          <>
            <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
            <Text testID="userId">{auth.user?.id ?? 'null'}</Text>
          </>
        );
      }

      render(
        <AuthProvider>
          <RegisterConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
      });

      await act(async () => {
        await registerFn('new@test.com', 'password', 'John', 'Doe');
      });

      expect(screen.getByTestId('isAuthenticated').props.children).toBe('true');
      expect(screen.getByTestId('userId').props.children).toBe('user1');
    });

    it('calls authService.register with correct params', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      let registerFn!: (
        email: string,
        password: string,
        firstName: string,
        lastName: string
      ) => Promise<void>;

      function RegisterCapture() {
        const auth = useAuth();
        registerFn = auth.register;
        return <Text testID="noop">noop</Text>;
      }

      render(
        <AuthProvider>
          <RegisterCapture />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('noop'));

      await act(async () => {
        await registerFn('new@test.com', 'pass', 'Jane', 'Doe');
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'pass',
        firstName: 'Jane',
        lastName: 'Doe',
      });
    });

    it('propagates registration errors to the caller', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already taken'));

      let registerFn!: (
        email: string,
        password: string,
        firstName: string,
        lastName: string
      ) => Promise<void>;

      function ErrorCapture() {
        const auth = useAuth();
        registerFn = auth.register;
        return <Text testID="noop">noop</Text>;
      }

      render(
        <AuthProvider>
          <ErrorCapture />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('noop'));

      await act(async () => {
        await expect(registerFn('dup@test.com', 'pass', 'A', 'B')).rejects.toThrow(
          'Email already taken'
        );
      });
    });
  });

  describe('refreshUser', () => {
    it('updates user state with fresh data from the server', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(true);
      mockUserService.getMe.mockResolvedValueOnce(mockUser);
      mockAuthService.getAccessToken.mockResolvedValue('token');

      const updatedUser: User = { ...mockUser, firstName: 'UpdatedName' };
      mockUserService.getMe.mockResolvedValueOnce(updatedUser);

      let refreshFn!: () => Promise<void>;

      function RefreshConsumer() {
        const auth = useAuth();
        refreshFn = auth.refreshUser;
        return <Text testID="firstName">{auth.user?.firstName ?? 'null'}</Text>;
      }

      render(
        <AuthProvider>
          <RefreshConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('firstName').props.children).toBe('John');
      });

      await act(async () => {
        await refreshFn();
      });

      expect(screen.getByTestId('firstName').props.children).toBe('UpdatedName');
    });

    it('propagates errors when refresh fails', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(false);
      mockUserService.getMe.mockRejectedValue(new Error('Unauthorized'));

      let refreshFn!: () => Promise<void>;

      function RefreshCapture() {
        const auth = useAuth();
        refreshFn = auth.refreshUser;
        return <Text testID="noop">noop</Text>;
      }

      render(
        <AuthProvider>
          <RefreshCapture />
        </AuthProvider>
      );

      await waitFor(() => screen.getByTestId('noop'));

      await act(async () => {
        await expect(refreshFn()).rejects.toThrow('Unauthorized');
      });
    });
  });
});
