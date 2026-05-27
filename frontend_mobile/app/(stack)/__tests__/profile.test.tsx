import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../profile';
import { defaultProfileUser } from './test-utils';

const mockReplace = global.__mockRouterReplace as jest.Mock;
const mockPush = global.__mockRouterPush as jest.Mock;
const mockBack = global.__mockRouterBack as jest.Mock;

let _mockConfirmResult = true;
const mockShowConfirm = jest.fn().mockImplementation(() => Promise.resolve(_mockConfirmResult));
jest.mock('@/context/ConfirmContext', () => ({
  showConfirm: (...args: any[]) => mockShowConfirm(...args),
  ConfirmProvider: ({ children }: any) => children,
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastInfo = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(
    jest.fn(),
    { error: (...args: any[]) => mockToastError(...args), success: (...args: any[]) => mockToastSuccess(...args), info: (...args: any[]) => mockToastInfo(...args) }
  ),
  ToastProvider: ({ children }: any) => children,
}));

const mockLogout = jest.fn();
const defaultAuthUser = defaultProfileUser;
const mockUseAuth = jest.fn(() => ({
  user: defaultAuthUser(),
  logout: mockLogout,
  isLoading: false,
}));

jest.mock('@/modules/auth/application/AuthContext', () => ({
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
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockToastInfo.mockClear();
    mockShowConfirm.mockClear();
    mockShowConfirm.mockImplementation(() => Promise.resolve(_mockConfirmResult));
    _mockConfirmResult = true;
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
    mockShowConfirm.mockResolvedValueOnce(true);

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

  it('shows error toast when logout throws', async () => {
    mockLogout.mockRejectedValue(new Error('network'));
    mockShowConfirm.mockResolvedValueOnce(true);

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
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

  it('shows confirm dialog and dismisses when cancel is pressed', async () => {
    mockShowConfirm.mockResolvedValueOnce(false);

    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: expect.any(String) }));
    });
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('navigates back when back chevron is pressed', () => {
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
