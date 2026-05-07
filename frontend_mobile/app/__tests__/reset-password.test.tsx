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
let mockParamsToken: string | string[] | undefined = 'reset-token-from-link';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({
    get token() { return mockParamsToken; },
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
    mockParamsToken = 'reset-token-from-link';
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

  it('shows error when token is empty', async () => {
    mockParamsToken = undefined;

    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    // Clear the token field (it starts empty when no param)
    fireEvent.changeText(getByTestId('reset-token-input'), '');
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(getByText('Token de reinitialisation requis')).toBeTruthy();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is empty', async () => {
    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    // Token is pre-filled from params; leave password empty
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(getByText('Nouveau mot de passe requis')).toBeTruthy();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows error when password is shorter than 8 characters', async () => {
    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'short');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(getByText('Le mot de passe doit contenir au moins 8 caracteres')).toBeTruthy();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Different123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows error alert when API call fails', async () => {
    (Alert.alert as jest.Mock).mockImplementation(() => {});
    mockResetPassword.mockRejectedValue(new Error('Token invalide'));

    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Token invalide');
      expect(getByText('Token invalide')).toBeTruthy();
    });
  });

  it('shows success message after reset and displays it in the UI', async () => {
    // Do not trigger the OK button press to keep the success message visible
    (Alert.alert as jest.Mock).mockImplementation(() => {});
    mockResetPassword.mockResolvedValue(undefined);

    const { getByTestId, getByText } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(getByText('Mot de passe reinitialise avec succes.')).toBeTruthy();
    });
  });

  it('navigates to login when back link is pressed', () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    fireEvent.press(getByTestId('reset-login-link'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('handles array token param by using the first element', async () => {
    mockParamsToken = ['first-token', 'second-token'];

    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (buttons && buttons[0]?.onPress) buttons[0].onPress();
    });
    mockResetPassword.mockResolvedValue(undefined);

    const { getByTestId } = render(<ResetPasswordScreen />);
    fireEvent.changeText(getByTestId('reset-password-input'), 'Password123');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Password123');
    fireEvent.press(getByTestId('reset-submit-button'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('first-token', 'Password123');
    });
  });

  it('renders with ios behavior when Platform.OS is ios', () => {
    const Platform = require('react-native').Platform;
    const original = Platform.OS;
    Platform.OS = 'ios';

    try {
      expect(() => render(<ResetPasswordScreen />)).not.toThrow();
    } finally {
      Platform.OS = original;
    }
  });

  it('renders with android height behavior when Platform.OS is android', () => {
    const Platform = require('react-native').Platform;
    const original = Platform.OS;
    Platform.OS = 'android';

    try {
      expect(() => render(<ResetPasswordScreen />)).not.toThrow();
    } finally {
      Platform.OS = original;
    }
  });
});
