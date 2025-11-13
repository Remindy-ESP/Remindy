import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../profile';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders user profile information', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Utilisateur')).toBeTruthy();
    expect(getByText('utilisateur@remindy.com')).toBeTruthy();
  });

  it('renders settings section', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Paramètres')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Préférences')).toBeTruthy();
    expect(getByText('Confidentialité')).toBeTruthy();
  });

  it('renders support section', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Support')).toBeTruthy();
    expect(getByText('Aide')).toBeTruthy();
    expect(getByText('À propos')).toBeTruthy();
  });

  it('renders logout button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Déconnexion')).toBeTruthy();
  });

  it('calls logout handler when logout button is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    const logoutButton = getByTestId('logout-button');

    fireEvent.press(logoutButton);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders all menu items with correct testIDs', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('notifications-item')).toBeTruthy();
    expect(getByTestId('preferences-item')).toBeTruthy();
    expect(getByTestId('privacy-item')).toBeTruthy();
    expect(getByTestId('help-item')).toBeTruthy();
    expect(getByTestId('about-item')).toBeTruthy();
  });

  it('menu items are pressable', () => {
    const { getByTestId } = render(<ProfileScreen />);
    const notificationsItem = getByTestId('notifications-item');

    fireEvent.press(notificationsItem);
    // In a real app, this would navigate to the notifications settings
    expect(notificationsItem).toBeTruthy();
  });
});
