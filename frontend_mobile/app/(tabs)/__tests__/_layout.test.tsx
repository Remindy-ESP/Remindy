import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import TabLayout from '../_layout';

// Mock expo-router
const mockReplace = jest.fn();

// screenProps collects the props passed to each Tabs.Screen render so we can
// later invoke the tabBarIcon function to exercise that branch.
const capturedScreenProps: any[] = [];

jest.mock('expo-router', () => {
  const TabsScreen = (props: any) => {
    capturedScreenProps.push(props);
    return null;
  };

  const Tabs = ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  };
  Tabs.Screen = TabsScreen;

  return {
    Tabs,
    useRouter: () => ({ replace: mockReplace }),
  };
});

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
jest.mock('@/shared/ui/GlobalHeader', () => {
  return function MockGlobalHeader() {
    const { View } = require('react-native');
    return <View />;
  };
});

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('@/modules/auth/application/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock MenuConfig with both footer (showInFooter: true) and hidden (showInFooter: false) routes
jest.mock('@/navigation/MenuConfig', () => ({
  APP_ROUTES: [
    {
      key: 'dashboard',
      labelKey: 'nav.dashboard',
      route: '/(tabs)/dashboard',
      showInBurger: true,
      showInFooter: true,
      footerIcon: 'home',
    },
    {
      key: 'cloud',
      labelKey: 'nav.cloud',
      route: '/(tabs)/cloud',
      showInBurger: true,
      showInFooter: false,
    },
  ],
}));

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedScreenProps.length = 0;
  });

  it('shows loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    const { UNSAFE_getByType } = render(<TabLayout />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('returns null when not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toBeNull();
  });

  it('renders the full tab layout when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    expect(() => render(<TabLayout />)).not.toThrow();
  });

  it('calls router.replace("/") when not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(<TabLayout />);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not redirect when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<TabLayout />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not redirect while still loading (even if not authenticated)', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    render(<TabLayout />);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders footer route Tabs.Screen entries with tabBarIcon option', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<TabLayout />);

    // At least one screen should have been captured
    expect(capturedScreenProps.length).toBeGreaterThan(0);

    // The footer route should have a tabBarIcon function
    const footerScreen = capturedScreenProps.find(
      (p: any) => p.options?.tabBarIcon !== undefined
    );
    expect(footerScreen).toBeDefined();
  });

  it('renders hidden route Tabs.Screen entries with href: null option', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<TabLayout />);

    const hiddenScreen = capturedScreenProps.find(
      (p: any) => p.options?.href === null && p.name !== 'profile'
    );
    expect(hiddenScreen).toBeDefined();
  });

  it('invokes tabBarIcon render function for footer routes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<TabLayout />);

    const footerScreen = capturedScreenProps.find(
      (p: any) => p.options?.tabBarIcon !== undefined
    );

    // Exercise the tabBarIcon function (covers lines 59-65 in _layout.tsx)
    const rendered = footerScreen.options.tabBarIcon({ color: '#6366f1', size: 24 });
    expect(rendered).toBeTruthy();
  });

  it('renders all tab screens including hidden ones', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(<TabLayout />);

    const names = capturedScreenProps.map((p: any) => p.name);
    expect(names).toContain('dashboard');
    expect(names).toContain('cloud');
  });
});
