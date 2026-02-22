import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileSecurityScreen from '../profile-security';

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

jest.spyOn(Alert, 'alert');

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
      expect(Alert.alert).toHaveBeenCalledWith('Succes', 'Votre mot de passe a ete modifie.');
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
});

