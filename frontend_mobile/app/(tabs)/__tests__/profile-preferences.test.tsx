import React from 'react';
import { render } from '@testing-library/react-native';
import ProfilePreferencesScreen from '../profile-preferences';

jest.mock('@/components/profile/PlaceholderScreen', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ title, subtitle, message }: any) => (
    <View>
      <Text>{title}</Text>
      <Text>{subtitle}</Text>
      {message && <Text>{message}</Text>}
    </View>
  );
});

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

  it('displays the placeholder message', () => {
    const { getByText } = render(<ProfilePreferencesScreen />);
    expect(getByText('Les preferences de profil seront configurees ici.')).toBeTruthy();
  });
});
