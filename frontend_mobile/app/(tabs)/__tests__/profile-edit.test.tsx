import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileEditScreen from '../profile-edit';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

const mockRefreshUser = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@test.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      role: 'user_freemium',
      status: 'active',
      timezone: 'Europe/Paris',
      language: 'fr',
      emailVerified: true,
      createdAt: '2026-02-22T00:00:00.000Z',
    },
    refreshUser: mockRefreshUser,
  }),
}));

const mockUpdateMe = jest.fn();
jest.mock('@/services/api', () => ({
  userService: {
    updateMe: (...args: any[]) => mockUpdateMe(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfileEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBack.mockClear();
    mockRefreshUser.mockClear();
  });

  it('renders current user profile fields', () => {
    const { getByDisplayValue } = render(<ProfileEditScreen />);
    expect(getByDisplayValue('John')).toBeTruthy();
    expect(getByDisplayValue('Doe')).toBeTruthy();
    expect(getByDisplayValue('+33612345678')).toBeTruthy();
    expect(getByDisplayValue('fr')).toBeTruthy();
    expect(getByDisplayValue('Europe/Paris')).toBeTruthy();
  });

  it('saves profile changes and refreshes user', async () => {
    mockUpdateMe.mockResolvedValue(undefined);
    const { getByTestId } = render(<ProfileEditScreen />);

    fireEvent.changeText(getByTestId('input-firstName'), 'Jane');
    fireEvent.press(getByTestId('save-profile-button'));

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
        })
      );
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });
  });
});

