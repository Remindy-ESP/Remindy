import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfilePreferencesScreen from '../profile-preferences';

const mockBack = jest.fn();
const mockSetLanguage = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

jest.mock('@/shared/application/I18nContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'fr',
    setLanguage: mockSetLanguage,
  }),
}));

describe('ProfilePreferencesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ProfilePreferencesScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the header title', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('profile.preferences.title')).toBeTruthy();
  });

  it('displays the header subtitle', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('profile.preferences.subtitle')).toBeTruthy();
  });

  it('displays language switcher buttons', () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    expect(getByTestId('language-switcher-fr')).toBeTruthy();
    expect(getByTestId('language-switcher-en')).toBeTruthy();
  });

  it('calls setLanguage with "en" when English is pressed', () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    fireEvent.press(getByTestId('language-switcher-en'));
    expect(mockSetLanguage).toHaveBeenCalledWith('en');
  });

  it('calls setLanguage with "fr" when French is pressed', () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    fireEvent.press(getByTestId('language-switcher-fr'));
    expect(mockSetLanguage).toHaveBeenCalledWith('fr');
  });

  it('navigates back when back button is pressed', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    fireEvent.press(getByText('chevron-back'));
    expect(mockBack).toHaveBeenCalled();
  });
});
