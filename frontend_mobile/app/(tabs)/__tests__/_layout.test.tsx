import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import TabLayout from '../_layout';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  Tabs: () => null,
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

// Mock GlobalHeader
jest.mock('@/components/GlobalHeader', () => {
  return function MockGlobalHeader() {
    const { View } = require('react-native');
    return <View />;
  };
});

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock MenuConfig
jest.mock('@/navigation/MenuConfig', () => ({
  APP_ROUTES: [],
}));

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { UNSAFE_getByType } = render(<TabLayout />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('returns null when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toBeNull();
  });

  it('does not crash with authenticated user', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1' },
    });

    // Just verify no crash
    expect(() => render(<TabLayout />)).not.toThrow();
  });
});
