import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../forgot-password';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

const mockForgotPassword = jest.fn();
jest.mock('@/services/api', () => ({
  authService: {
    forgotPassword: (...args: any[]) => mockForgotPassword(...args),
  },
  getErrorMessage: jest.fn((err: any, fallback: string) => err?.message || fallback),
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits forgot password request', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    const { getByTestId, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com');
      expect(getByText(/Si cet email existe/i)).toBeTruthy();
    });
  });
});

