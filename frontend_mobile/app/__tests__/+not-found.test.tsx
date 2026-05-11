import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NotFoundScreen from '../+not-found';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: jest.fn(),
  }),
}));

jest.mock('@/components/system/AppStatusScreen', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ code, title, message, actions }: any) => (
    <View>
      <Text>{code}</Text>
      <Text>{title}</Text>
      <Text>{message}</Text>
      {actions.map((action: any) => (
        <TouchableOpacity key={action.label} testID={action.testID} onPress={action.onPress}>
          <Text>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

describe('NotFoundScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<NotFoundScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays 404 code', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('404')).toBeTruthy();
  });

  it('displays the correct title', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('Page introuvable')).toBeTruthy();
  });

  it('displays the correct message', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText(/La page que vous cherchez/)).toBeTruthy();
  });

  it('navigates to dashboard when home button is pressed', () => {
    const { getByTestId } = render(<NotFoundScreen />);
    fireEvent.press(getByTestId('not-found-home-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(<NotFoundScreen />);
    fireEvent.press(getByTestId('not-found-back-button'));
    expect(mockBack).toHaveBeenCalled();
  });
});
