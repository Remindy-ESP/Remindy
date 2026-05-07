import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import ResetPasswordScreen from '../reset-password';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({
    token: 'reset-token-from-link',
  }),
}));

const mockResetPassword = jest.fn();
jest.mock('@/services/api', () => ({
  authService: {
    resetPassword: (...args: any[]) => mockResetPassword(...args),
  },
  getErrorMessage: jest.fn((err: any, fallback: string) => err?.message || fallback),
}));

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('submits reset password request with token from params', async () => {
    mockResetPassword.mockResolvedValue(undefined);

    const { getByTestId } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('reset-token-from-link', 'Password123');
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Mot de passe réinitialisé',
        text2: 'Vous pouvez maintenant vous connecter.',
      });
    });

    // Advance timers to trigger the setTimeout navigation
    jest.advanceTimersByTime(1500);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
