import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfilePrivacyScreen from '../profile-privacy';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
}));

const mockLogout = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}));

const mockExportData = jest.fn();
const mockDeleteMe = jest.fn();
jest.mock('@/services/api', () => ({
  userService: {
    exportData: (...args: any[]) => mockExportData(...args),
    deleteMe: (...args: any[]) => mockDeleteMe(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfilePrivacyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests data export', async () => {
    mockExportData.mockResolvedValue({
      id: 'export-1',
      status: 'pending',
      format: 'json',
    });

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('export-data-button'));

    await waitFor(() => {
      expect(mockExportData).toHaveBeenCalledWith({ format: 'json' });
    });
  });

  it('deletes account after confirmation', async () => {
    (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    mockDeleteMe.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);

    const { getByTestId } = render(<ProfilePrivacyScreen />);
    fireEvent.press(getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(mockDeleteMe).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});

