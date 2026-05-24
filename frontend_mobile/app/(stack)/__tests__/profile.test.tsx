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
const mockUseAuth = jest.fn(() => ({
  user: {
    id: 'test-user-id',
    email: 'utilisateur@remindy.com',
    firstName: 'Test',
    lastName: 'User',
    photoR2Key: 'users/test-user/profile-photo/avatar.jpg',
    photoUrl: 'https://cdn.example.com/avatar.jpg',
    role: 'user_freemium',
    status: 'active',
    timezone: 'Europe/Paris',
    language: 'fr',
    emailVerified: true,
    createdAt: '2026-02-22T00:00:00.000Z',
  },
  logout: mockLogout,
  isLoading: false,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: (...args: any[]) => (mockUseAuth as jest.Mock)(...args),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogout.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'utilisateur@remindy.com',
        firstName: 'Test',
        lastName: 'User',
        photoR2Key: 'users/test-user/profile-photo/avatar.jpg',
        photoUrl: 'https://cdn.example.com/avatar.jpg',
        role: 'user_freemium',
        status: 'active',
        timezone: 'Europe/Paris',
        language: 'fr',
        emailVerified: true,
        createdAt: '2026-02-22T00:00:00.000Z',
      },
      logout: mockLogout,
      isLoading: false,
    });
  });

  it('renders user profile information', () => {
    const { getByText, getAllByText } = render(<ProfileScreen />);
    expect(getByText('Test User')).toBeTruthy();
    expect(getAllByText('utilisateur@remindy.com').length).toBeGreaterThan(0);
    expect(getByText('Profil')).toBeTruthy();
  });

  it('renders the profile photo when available', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-hero-avatar-image').props.source).toEqual({
      uri: 'https://cdn.example.com/avatar.jpg',
    });
  });

  it('renders settings and support sections', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Parametres')).toBeTruthy();
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Securite')).toBeTruthy();
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
    mockLogout.mockResolvedValue(undefined);
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
    expect(getByTestId('security-item')).toBeTruthy();
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
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-edit');
  });

  it('navigates to profile security page when security item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('security-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-security');
  });

  // ── Missing coverage ────────────────────────────────────────────────────────

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
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Echec de la deconnexion. Veuillez reessayer.',
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

  it('navigates to preferences when preferences item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('preferences-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-preferences');
  });

  it('navigates to privacy when privacy item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('privacy-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-privacy');
  });

  it('navigates to help when help item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('help-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-help');
  });

  it('navigates to about when about item is pressed', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('about-item'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/profile-about');
  });

  it('shows alert dialog and dismisses when cancel is pressed', () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      // press Annuler (index 0)
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    });

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Deconnexion',
      'Etes-vous sur de vouloir vous deconnecter ?',
      expect.any(Array),
    );
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
