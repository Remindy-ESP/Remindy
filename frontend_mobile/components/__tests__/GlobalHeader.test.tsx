import React from 'react';
import { render } from '@testing-library/react-native';
import GlobalHeader from '../GlobalHeader';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock SafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 20,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock BurgerMenu
jest.mock('../BurgerMenu', () => {
  return function MockBurgerMenu() {
    const { View } = require('react-native');
    return <View testID="burger-menu" />;
  };
});

// Mock MenuConfig
jest.mock('@/navigation/MenuConfig', () => ({
  APP_ROUTES: [],
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      firstName: 'Jane',
      lastName: 'Doe',
      photoUrl: 'https://cdn.example.com/jane.jpg',
    },
  }),
}));

describe('GlobalHeader', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<GlobalHeader />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders menu icon', () => {
    const { UNSAFE_getAllByType } = render(<GlobalHeader />);
    const ionicons = UNSAFE_getAllByType('Ionicons' as unknown as React.ComponentType<unknown>);
    expect(ionicons.length).toBeGreaterThan(0);
  });

  it('renders burger menu component', () => {
    const { getByTestId } = render(<GlobalHeader />);
    expect(getByTestId('burger-menu')).toBeTruthy();
  });

  it('renders the authenticated user photo in header avatar', () => {
    const { getByTestId } = render(<GlobalHeader />);
    expect(getByTestId('header-avatar-image').props.source).toEqual({
      uri: 'https://cdn.example.com/jane.jpg',
    });
  });
});
