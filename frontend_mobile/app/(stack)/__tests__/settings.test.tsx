import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettingsScreen from '../settings';
import { mockAlertPressButton } from './test-utils';

const mockReplace = global.__mockRouterReplace as jest.Mock;
const mockPush = global.__mockRouterPush as jest.Mock;
const mockBack = global.__mockRouterBack as jest.Mock;

jest.spyOn(Alert, 'alert');

const mockLogout = jest.fn();
jest.mock('@/modules/auth/application/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

// Mock @expo/vector-icons locally to render the icon name as text
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
    mockLogout.mockClear();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('renders section cards and titles', () => {
    const { getByText, getAllByText } = render(<SettingsScreen />);
    expect(getAllByText('Réglages').length).toBeGreaterThan(0);
    expect(getByText('Support')).toBeTruthy();
  });

  it('renders all menu items with correct labels', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Préférences')).toBeTruthy();
    expect(getByText('Sécurité')).toBeTruthy();
    expect(getByText('Confidentialité')).toBeTruthy();
    expect(getByText('Aide')).toBeTruthy();
    expect(getByText('À propos')).toBeTruthy();
  });

  it('navigates to notifications page when notifications item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-notifications-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-notifications');
  });

  it('navigates to preferences page when preferences item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-preferences-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-preferences');
  });

  it('navigates to security page when security item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-security-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-security');
  });

  it('navigates to privacy page when privacy item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-privacy-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-privacy');
  });

  it('navigates to help page when help item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-help-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-help');
  });

  it('navigates to about page when about item is pressed', () => {
    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-about-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-about');
  });

  it('calls logout handler when logout button is pressed', async () => {
    mockLogout.mockResolvedValue(undefined);
    mockAlertPressButton(1);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows alert dialog and dismisses when cancel is pressed', () => {
    mockAlertPressButton(0);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      expect.any(Array),
    );
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows error alert when logout throws', async () => {
    mockLogout.mockRejectedValue(new Error('network'));
    mockAlertPressButton(1);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Échec de la déconnexion. Veuillez réessayer.',
      );
    });
  });

  it('navigates back when back chevron is pressed', () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
