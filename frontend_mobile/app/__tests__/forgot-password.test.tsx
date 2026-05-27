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

jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  }),
  ToastProvider: ({ children }: any) => children,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockToast = require('@/context/ToastContext').toast as {
  error: jest.Mock;
  success: jest.Mock;
  info: jest.Mock;
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
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
    mockForgotPassword.mockRejectedValue(new Error('Serveur indisponible'));

    const { getByTestId, getByText } = render(<ForgotPasswordScreen />);
    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-submit-button'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Serveur indisponible');
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

