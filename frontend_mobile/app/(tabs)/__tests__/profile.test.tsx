import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../profile';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock AuthContext
const mockLogout = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'utilisateur@remindy.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user_freemium',
    },
    logout: mockLogout,
    isLoading: false,
  })),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockLogout.mockClear();
    jest.clearAllMocks();
  });

  it('renders user profile information', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Test User')).toBeTruthy();
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

  it('calls logout handler when logout button is pressed', async () => {
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      // Simulate pressing the "Déconnexion" button (second button)
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getByTestId } = render(<ProfileScreen />);
    const logoutButton = getByTestId('logout-button');

    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
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
