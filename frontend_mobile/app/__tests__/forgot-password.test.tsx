import React from 'react';
import { Alert } from 'react-native';
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

jest.spyOn(Alert, 'alert');

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

  it('shows error when email field is empty', async () => {
    const { getByTestId, getByText } = render(<ForgotPasswordScreen />);
    // Do not type anything — email starts empty
    fireEvent.press(getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(getByText("L'email est requis")).toBeTruthy();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('shows error when email is only whitespace', async () => {
    const { getByTestId, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByTestId('forgot-email-input'), '   ');
    fireEvent.press(getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(getByText("L'email est requis")).toBeTruthy();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when API call fails', async () => {
    (Alert.alert as jest.Mock).mockImplementation(() => {});
    mockForgotPassword.mockRejectedValue(new Error('Serveur indisponible'));

    const { getByTestId, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Serveur indisponible');
      expect(getByText('Serveur indisponible')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByTestId('forgot-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders with ios behavior when Platform.OS is ios', () => {
    const Platform = require('react-native').Platform;
    const original = Platform.OS;
    Platform.OS = 'ios';

    try {
      expect(() => render(<ForgotPasswordScreen />)).not.toThrow();
    } finally {
      Platform.OS = original;
    }
  });

  it('renders with android height behavior when Platform.OS is android', () => {
    const Platform = require('react-native').Platform;
    const original = Platform.OS;
    Platform.OS = 'android';

    try {
      expect(() => render(<ForgotPasswordScreen />)).not.toThrow();
    } finally {
      Platform.OS = original;
    }
  });
});

