import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPasswordScreen from '../reset-password';

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

jest.spyOn(Alert, 'alert');

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits reset password request with token from params', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });
    mockResetPassword.mockResolvedValue(undefined);

    const { getByTestId } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('reset-token-from-link', 'Password123');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});

