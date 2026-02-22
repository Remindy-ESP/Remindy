import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../profile';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.spyOn(Alert, 'alert');

const mockLogout = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'utilisateur@remindy.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user_freemium',
      status: 'active',
      timezone: 'Europe/Paris',
      language: 'fr',
      emailVerified: true,
      createdAt: '2026-02-22T00:00:00.000Z',
    },
    logout: mockLogout,
    isLoading: false,
  })),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogout.mockClear();
    jest.clearAllMocks();
  });

  it('renders user profile information', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);
    expect(getByText('Test User')).toBeTruthy();
    expect(getAllByText('utilisateur@remindy.com').length).toBeGreaterThan(0);
    expect(getByText('Profil')).toBeTruthy();
  });

  it('renders settings and support sections', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Parametres')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Confidentialite')).toBeTruthy();
    expect(getByText('Support')).toBeTruthy();
    expect(getByText('Aide')).toBeTruthy();
    expect(getByText('A propos')).toBeTruthy();
  });

  it('renders logout button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Deconnexion')).toBeTruthy();
  });

  it('calls logout handler when logout button is pressed', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

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
    expect(getByTestId('edit-profile-item')).toBeTruthy();
  });

  it('navigates to notifications page when notifications item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('notifications-item'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/notifications');
  });

  it('navigates to profile edit page when edit button is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('edit-profile-item'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/profile-edit');
  });
});
