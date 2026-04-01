import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StatisticsScreen from '../statistics';

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    // Don't call the callback to avoid async state update issues
  }),
}));

const mockDefaultReturn = {
  activePeriod: 'month',
  setActivePeriod: jest.fn(),
  timePeriods: [
    { key: 'day', label: 'Ce jour' },
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mensuel' },
    { key: 'year', label: 'Année' },
  ],
  loading: false,
  error: null,
  fetchData: jest.fn(),
  getStatsForPeriod: jest.fn(() => ({
    totalExpenses: 53.97,
    transactionCount: 3,
    averageTransaction: 17.99,
    categoryBreakdown: [
      { name: 'Streaming', icon: '🎬', color: '#e50914', total: 23.98, count: 2 },
      { name: 'Sport', icon: '💪', color: '#22c55e', total: 29.99, count: 1 },
    ],
  })),
};

// Mock useStatistics hook
jest.mock('../../../hooks/useStatistics', () => ({
  useStatistics: jest.fn(() => mockDefaultReturn),
}));

describe('StatisticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue(mockDefaultReturn);
  });

  it('should render the header', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Statistiques')).toBeTruthy();
    expect(getByText('Consultez vos statistiques')).toBeTruthy();
  });

  it('should render all four period filter tabs', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Ce jour')).toBeTruthy();
    expect(getByText('Semaine')).toBeTruthy();
    expect(getByText('Mensuel')).toBeTruthy();
    expect(getByText('Année')).toBeTruthy();
  });

  it('should render period tabs with testIDs', () => {
    const { getByTestId } = render(<StatisticsScreen />);
    expect(getByTestId('period-day')).toBeTruthy();
    expect(getByTestId('period-week')).toBeTruthy();
    expect(getByTestId('period-month')).toBeTruthy();
    expect(getByTestId('period-year')).toBeTruthy();
  });

  it('should call setActivePeriod when a tab is pressed', () => {
    const mockSetActivePeriod = jest.fn();
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({
      ...mockDefaultReturn,
      setActivePeriod: mockSetActivePeriod,
    });

    const { getByTestId } = render(<StatisticsScreen />);

    fireEvent.press(getByTestId('period-day'));
    expect(mockSetActivePeriod).toHaveBeenCalledWith('day');

    fireEvent.press(getByTestId('period-year'));
    expect(mockSetActivePeriod).toHaveBeenCalledWith('year');
  });

  it('should display summary cards with correct values', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Total dépenses')).toBeTruthy();
    expect(getByText('53.97€')).toBeTruthy();
    expect(getByText('Transactions')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Moyenne par transaction')).toBeTruthy();
    expect(getByText('17.99€')).toBeTruthy();
  });

  it('should display category breakdown', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Répartition par catégorie')).toBeTruthy();
    expect(getByText('Streaming')).toBeTruthy();
    expect(getByText('23.98€')).toBeTruthy();
    expect(getByText('2 transactions')).toBeTruthy();
    expect(getByText('Sport')).toBeTruthy();
    expect(getByText('29.99€')).toBeTruthy();
    expect(getByText('1 transaction')).toBeTruthy();
  });

  it('should show empty state when no events for period', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({
      ...mockDefaultReturn,
      getStatsForPeriod: jest.fn(() => ({
        totalExpenses: 0,
        transactionCount: 0,
        averageTransaction: 0,
        categoryBreakdown: [],
      })),
    });

    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Aucune dépense pour cette période')).toBeTruthy();
  });

  it('should show loading state', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({
      ...mockDefaultReturn,
      loading: true,
    });

    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Chargement des statistiques...')).toBeTruthy();
  });

  it('should show error state', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({
      ...mockDefaultReturn,
      error: 'Network Error',
    });

    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Erreur : Network Error')).toBeTruthy();
  });

  it('should render with correct structure', () => {
    const { toJSON } = render(<StatisticsScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
