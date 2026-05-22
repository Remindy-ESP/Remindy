import React from 'react';
import { render } from '@testing-library/react-native';
import ProfilePreferencesScreen from '../profile-preferences';

describe('ProfilePreferencesScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ProfilePreferencesScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the title', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('Preferences')).toBeTruthy();
  });

  it('displays the subtitle', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('Reglages de profil et options utilisateur')).toBeTruthy();
  });

  it('renders the language switcher', () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    expect(getByTestId('language-switcher')).toBeTruthy();
  });

  it('renders an option for each supported language', () => {
    const { getByTestId } = render(<ProfilePreferencesScreen />);
    expect(getByTestId('language-option-en')).toBeTruthy();
    expect(getByTestId('language-option-fr')).toBeTruthy();
  });
});
