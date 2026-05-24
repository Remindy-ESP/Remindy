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
  const { AppStatusScreenMock } = require('./testUtils');
  return AppStatusScreenMock;
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
