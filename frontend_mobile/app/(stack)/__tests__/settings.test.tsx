import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../settings';

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
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockToastInfo.mockClear();
    mockShowConfirm.mockClear();
    mockShowConfirm.mockImplementation(() => Promise.resolve(_mockConfirmResult));
    _mockConfirmResult = true;
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
    mockShowConfirm.mockResolvedValueOnce(true);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows confirm dialog and dismisses when cancel is pressed', async () => {
    mockShowConfirm.mockResolvedValueOnce(false);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    await waitFor(() => {
      expect(mockShowConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: expect.any(String) }));
    });
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows error toast when logout throws', async () => {
    mockLogout.mockRejectedValue(new Error('network'));
    mockShowConfirm.mockResolvedValueOnce(true);

    const { getByTestId } = render(<SettingsScreen />);
    fireEvent.press(getByTestId('settings-logout-button'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('navigates back when back chevron is pressed', () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
