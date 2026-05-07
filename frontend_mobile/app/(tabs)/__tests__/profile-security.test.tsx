import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import ProfileSecurityScreen from '../profile-security';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

const mockChangePassword = jest.fn();
jest.mock('@/services/api', () => ({
  authService: {
    changePassword: (...args: any[]) => mockChangePassword(...args),
  },
  getErrorMessage: (error: any, fallback: string) => error?.message || fallback,
}));

describe('ProfileSecurityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields before submit', async () => {
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.press(getByTestId('change-password-button'));

    expect(await findByText('Mot de passe actuel requis')).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('submits password change with valid values', async () => {
    mockChangePassword.mockResolvedValue(undefined);
    const { getByTestId } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword123');
    fireEvent.press(getByTestId('change-password-button'));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('OldPassword123', 'NewPassword123');
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Mot de passe modifié',
        text2: 'Votre mot de passe a été mis à jour.',
      });
    });
  });

  it('navigates to forgot-password flow', () => {
    const { getByTestId } = render(<ProfileSecurityScreen />);

    fireEvent.press(getByTestId('security-forgot-button'));

    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
  });

  it('goes back when pressing back button', () => {
    const { getByTestId } = render(<ProfileSecurityScreen />);

    fireEvent.press(getByTestId('security-back-button'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('shows error when new password is missing (line 39)', async () => {
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    // newPassword intentionally left empty
    fireEvent.press(getByTestId('change-password-button'));

    expect(await findByText('Nouveau mot de passe requis')).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is too short (line 43)', async () => {
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'Short1');
    fireEvent.press(getByTestId('change-password-button'));

    expect(
      await findByText('Le nouveau mot de passe doit contenir au moins 8 caracteres')
    ).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password equals current password (line 47)', async () => {
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'SamePassword1');
    fireEvent.changeText(getByTestId('new-password-input'), 'SamePassword1');
    fireEvent.press(getByTestId('change-password-button'));

    expect(
      await findByText('Le nouveau mot de passe doit etre different de l ancien')
    ).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match (line 51)', async () => {
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'DifferentPass1');
    fireEvent.press(getByTestId('change-password-button'));

    expect(await findByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('shows error message and alert when API call fails (lines 75-77)', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Unauthorized'));
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword123');
    fireEvent.press(getByTestId('change-password-button'));

    // The error message from the catch block should be displayed inline
    expect(await findByText('Unauthorized')).toBeTruthy();
    // And an alert should have been shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Unauthorized');
    });
  });

  it('clears error/success messages when user edits an input field', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Bad request'));
    const { getByTestId, findByText, queryByText } = render(<ProfileSecurityScreen />);

    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword123');
    fireEvent.press(getByTestId('change-password-button'));

    // Wait for error to appear
    await findByText('Bad request');

    // Now type into the current password field — resetMessages() is called
    fireEvent.changeText(getByTestId('current-password-input'), 'Typing...');

    await waitFor(() => {
      expect(queryByText('Bad request')).toBeNull();
    });
  });

  it('clears messages when typing into new-password field', async () => {
    const { getByTestId, findByText, queryByText } = render(<ProfileSecurityScreen />);
    fireEvent.press(getByTestId('change-password-button'));
    await findByText('Mot de passe actuel requis');
    fireEvent.changeText(getByTestId('new-password-input'), 'x');
    expect(queryByText('Mot de passe actuel requis')).toBeNull();
  });

  it('clears messages when typing into confirm-password field', async () => {
    const { getByTestId, findByText, queryByText } = render(<ProfileSecurityScreen />);
    fireEvent.press(getByTestId('change-password-button'));
    await findByText('Mot de passe actuel requis');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'x');
    expect(queryByText('Mot de passe actuel requis')).toBeNull();
  });

  it('shows success message after successful password change', async () => {
    mockChangePassword.mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);
    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword12345');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword12345');
    fireEvent.press(getByTestId('change-password-button'));
    expect(await findByText('Mot de passe modifie avec succes.')).toBeTruthy();
  });

  it('resets input fields after successful password change', async () => {
    mockChangePassword.mockResolvedValue(undefined);
    const { getByTestId } = render(<ProfileSecurityScreen />);
    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword12345');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword12345');
    fireEvent.press(getByTestId('change-password-button'));
    await waitFor(() => {
      expect(getByTestId('current-password-input').props.value).toBe('');
      expect(getByTestId('new-password-input').props.value).toBe('');
      expect(getByTestId('confirm-password-input').props.value).toBe('');
    });
  });

  it('uses fallback error message when API error has no message property', async () => {
    mockChangePassword.mockRejectedValueOnce('string-error');
    const { getByTestId, findByText } = render(<ProfileSecurityScreen />);
    fireEvent.changeText(getByTestId('current-password-input'), 'OldPassword123');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword12345');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword12345');
    fireEvent.press(getByTestId('change-password-button'));
    expect(await findByText('Impossible de modifier le mot de passe.')).toBeTruthy();
  });

  it('renders correctly on iOS platform (covers Platform.OS ios branch at line 85)', () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'ios';
    try {
      const { toJSON } = render(<ProfileSecurityScreen />);
      expect(toJSON()).toBeTruthy();
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('renders correctly on Android platform (covers Platform.OS android/height branch at line 85)', () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';
    try {
      const { toJSON } = render(<ProfileSecurityScreen />);
      expect(toJSON()).toBeTruthy();
    } finally {
      Platform.OS = originalOS;
    }
  });
});
