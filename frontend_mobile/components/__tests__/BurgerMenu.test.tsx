import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BurgerMenu from '@/shared/ui/BurgerMenu';
import { AppRoute } from '@/navigation/MenuConfig';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
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
  }),
}));

const mockItems: AppRoute[] = [
  {
    key: 'dashboard',
    labelKey: 'nav.dashboard',
    route: '/(tabs)/dashboard',
    showInBurger: true,
    showInFooter: false,
    burgerIcon: 'home',
    footerIcon: 'home',
  },
];

describe('BurgerMenu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const { getByText } = render(
      <BurgerMenu isVisible={true} onClose={mockOnClose} items={mockItems} />
    );
    expect(getByText('Accueil')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <BurgerMenu isVisible={false} onClose={mockOnClose} items={mockItems} />
    );
    expect(queryByText('Accueil')).toBeNull();
  });

  it('navigates when item pressed', () => {
    const { getByText } = render(
      <BurgerMenu isVisible={true} onClose={mockOnClose} items={mockItems} />
    );
    fireEvent.press(getByText('Accueil'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/dashboard');
  });

  it('renders with empty items', () => {
    const { toJSON } = render(
      <BurgerMenu isVisible={true} onClose={mockOnClose} items={[]} />
    );
    expect(toJSON()).toBeTruthy();
  });
});
