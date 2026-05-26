import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileScreen from '../profile';
import { defaultProfileUser, mockAlertPressButton } from './test-utils';

const mockReplace = global.__mockRouterReplace as jest.Mock;
const mockPush = global.__mockRouterPush as jest.Mock;
const mockBack = global.__mockRouterBack as jest.Mock;

jest.spyOn(Alert, 'alert');

const mockLogout = jest.fn();
const defaultAuthUser = defaultProfileUser;
const mockUseAuth = jest.fn(() => ({
  user: defaultAuthUser(),
  logout: mockLogout,
  isLoading: false,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: (...args: any[]) => (mockUseAuth as jest.Mock)(...args),
}));

// Mock @expo/vector-icons locally to render the icon name as text
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
    mockLogout.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    mockUseAuth.mockReturnValue({
      user: defaultAuthUser(),
      logout: mockLogout,
      isLoading: false,
    });
  });

  it('renders user profile information', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);
    expect(getByText('Test User')).toBeTruthy();
    expect(getAllByText('utilisateur@remindy.com').length).toBeGreaterThan(0);
    expect(getAllByText('Profil').length).toBeGreaterThan(0);
  });

  it('renders the profile photo when available', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-hero-avatar-image').props.source).toEqual({
      uri: 'https://cdn.example.com/avatar.jpg',
    });
  });

  it('renders logout button', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Déconnexion')).toBeTruthy();
  });

  it('calls logout handler when logout button is pressed', async () => {
    mockLogout.mockResolvedValue(undefined);
    mockAlertPressButton(1);

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('navigates to profile edit page when edit button is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('edit-profile-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-edit');
  });

  it('shows loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      user: null as any,
      logout: mockLogout,
      isLoading: true,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Chargement du profil...')).toBeTruthy();
  });

  it('shows fallback username "Utilisateur" when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null as any,
      logout: mockLogout,
      isLoading: false,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Utilisateur')).toBeTruthy();
  });

  it('shows fallback username "Utilisateur" when firstName and lastName are empty', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', firstName: '', lastName: '' } as any,
      logout: mockLogout,
      isLoading: false,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Utilisateur')).toBeTruthy();
  });

  it('shows fallback email when user has no email', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: null as any, firstName: 'Jane', lastName: 'Doe' } as any,
      logout: mockLogout,
      isLoading: false,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('utilisateur@remindy.com')).toBeTruthy();
  });

  it('shows fallback role "user" when user.role is undefined', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', role: undefined as any } as any,
      logout: mockLogout,
      isLoading: false,
    });
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('user')).toBeTruthy();
  });

  it('shows error alert when logout throws', async () => {
    mockLogout.mockRejectedValue(new Error('network'));
    mockAlertPressButton(1);

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Échec de la déconnexion. Veuillez réessayer.',
      );
    });
  });

  it('shows initials avatar when photoUrl is absent', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        email: 'a@b.com',
        firstName: 'Jane',
        lastName: 'Doe',
        photoUrl: null as any,
      } as any,
      logout: mockLogout,
      isLoading: false,
    });
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-hero-avatar-initials')).toBeTruthy();
  });

  it('shows alert dialog and dismisses when cancel is pressed', () => {
    mockAlertPressButton(0);

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      expect.any(Array),
    );
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('navigates back when back chevron is pressed', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
