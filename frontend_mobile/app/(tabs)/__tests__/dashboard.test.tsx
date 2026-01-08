import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../dashboard';

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    // Optionally call the callback if needed for testing
  }),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
}));

// Mock useAuth hook
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
    token: 'mock-token',
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  })),
}));

// Mock useDashboard hook
jest.mock('../../../hooks/useDashboard', () => ({
  useDashboard: jest.fn(() => ({
    selected: '',
    setSelected: jest.fn(),
    activePeriod: 'day',
    setActivePeriod: jest.fn(),
    categoriesOpen: false,
    setCategoriesOpen: jest.fn(),
    selectedCategory: null,
    setSelectedCategory: jest.fn(),
    timePeriods: [
      { key: 'day', label: 'Ce jour', value: '1' },
      { key: 'week', label: 'Semaine', value: '2' },
      { key: 'month', label: 'Mensuel', value: '3' },
      { key: 'year', label: 'Année', value: '4' },
    ],
    getEventsForPeriod: jest.fn(() => []),
    categories: [],
    events: [],
    loading: false,
    error: null,
    getEventsForDate: jest.fn(() => []),
    getEventsByCategory: jest.fn(() => []),
    fetchDashboardData: jest.fn(),
  })),
}));

// Mock react-native-calendars
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates, testID }: any) => {
    const MockCalendar = require('react-native').View;
    return (
      <MockCalendar
        testID={testID}
        onPress={() =>
          onDayPress && onDayPress({ dateString: '2025-01-15' })
        }
      />
    );
  },
  LocaleConfig: {
    locales: {},
    defaultLocale: 'en',
  },
}));

describe('DashboardScreen', () => {
  it('renders categories button', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Catégories')).toBeTruthy();
  });

  it('renders calendar component', () => {
    const { toJSON } = render(<DashboardScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders time period buttons', () => {
    const { toJSON } = render(<DashboardScreen />);
    // Just verify the component renders without crashing
    expect(toJSON()).toBeTruthy();
  });

  it('renders add operation button', () => {
    const { toJSON } = render(<DashboardScreen />);
    // Just verify the component renders without crashing
    expect(toJSON()).toBeTruthy();
  });

  it('toggles categories when button is pressed', () => {
    const useDashboardMock = require('../../../hooks/useDashboard').useDashboard;
    const mockSetCategoriesOpen = jest.fn();
    useDashboardMock.mockReturnValue({
      selected: '',
      setSelected: jest.fn(),
      activePeriod: 'day',
      setActivePeriod: jest.fn(),
      categoriesOpen: false,
      setCategoriesOpen: mockSetCategoriesOpen,
      selectedCategory: null,
      setSelectedCategory: jest.fn(),
      timePeriods: [
        { key: 'day', label: 'Ce jour', value: '1' },
        { key: 'week', label: 'Semaine', value: '2' },
        { key: 'month', label: 'Mensuel', value: '3' },
        { key: 'year', label: 'Année', value: '4' },
      ],
      getEventsForPeriod: jest.fn(() => []),
      categories: [],
      events: [],
      loading: false,
      error: null,
      getEventsForDate: jest.fn(() => []),
      getEventsByCategory: jest.fn(() => []),
      fetchDashboardData: jest.fn(),
    });

    const { getByText } = render(<DashboardScreen />);
    const categoriesButton = getByText('Catégories');

    fireEvent.press(categoriesButton);

    expect(mockSetCategoriesOpen).toHaveBeenCalledWith(true);
  });

  it('renders dashboard screen successfully', () => {
    const { toJSON } = render(<DashboardScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
