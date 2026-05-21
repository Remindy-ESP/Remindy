import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import StatisticsScreen from '../statistics';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

const mockUseStatisticsReturn = {
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

const mockUseExpenseSummaryReturn = {
  data: {
    periodLabel: 'Octobre 2025',
    currentTotal: 203.85,
    previousTotal: 211.2,
    percentageChange: -3.5,
    trend: 'down' as const,
    comparisonLabel: 'Comparo M-1',
  },
  loading: false,
  error: null as string | null,
  refetch: jest.fn(),
};

jest.mock('../../../hooks/useStatistics', () => ({
  useStatistics: jest.fn(() => mockUseStatisticsReturn),
}));

jest.mock('../../../hooks/useExpenseSummary', () => ({
  useExpenseSummary: jest.fn(() => mockUseExpenseSummaryReturn),
}));

describe('StatisticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue(mockUseStatisticsReturn);
    const { useExpenseSummary } = require('../../../hooks/useExpenseSummary');
    useExpenseSummary.mockReturnValue(mockUseExpenseSummaryReturn);
  });

  it('renders the screen header', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Statistiques')).toBeTruthy();
    expect(getByText('Consultez vos statistiques')).toBeTruthy();
  });

  it('renders all four period filter tabs', () => {
    const { getByText, getByTestId } = render(<StatisticsScreen />);
    expect(getByText('Ce jour')).toBeTruthy();
    expect(getByText('Semaine')).toBeTruthy();
    expect(getByText('Mensuel')).toBeTruthy();
    expect(getByText('Année')).toBeTruthy();
    expect(getByTestId('period-day')).toBeTruthy();
    expect(getByTestId('period-year')).toBeTruthy();
  });

  it('calls setActivePeriod when a tab is pressed', () => {
    const setActivePeriod = jest.fn();
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({ ...mockUseStatisticsReturn, setActivePeriod });

    const { getByTestId } = render(<StatisticsScreen />);
    fireEvent.press(getByTestId('period-day'));
    expect(setActivePeriod).toHaveBeenCalledWith('day');
    fireEvent.press(getByTestId('period-year'));
    expect(setActivePeriod).toHaveBeenCalledWith('year');
  });

  it('renders the Bilan des dépenses header with summary data', () => {
    const { getByText, getByTestId } = render(<StatisticsScreen />);
    expect(getByText('Bilan des dépenses')).toBeTruthy();
    expect(getByText('Comparo M-1')).toBeTruthy();
    expect(getByTestId('expense-period-label').props.children).toBe('Octobre 2025');
    expect(getByTestId('expense-total-amount').props.children).toMatch(/203,85/);
    expect(getByTestId('comparison-percentage').props.children).toBe('-3.5%');
  });

  it('opens the comparison info modal when the info icon is pressed', () => {
    const { getByTestId, queryByTestId } = render(<StatisticsScreen />);
    expect(queryByTestId('comparison-info-text')).toBeNull();

    fireEvent.press(getByTestId('comparison-info-button'));

    expect(getByTestId('comparison-info-text').props.children).toMatch(
      /depuis le début du mois/,
    );
  });

  it('closes the modal when the close button is pressed', () => {
    const { getByTestId, queryByTestId } = render(<StatisticsScreen />);
    fireEvent.press(getByTestId('comparison-info-button'));
    expect(getByTestId('comparison-info-text')).toBeTruthy();

    fireEvent.press(getByTestId('comparison-info-close'));
    expect(queryByTestId('comparison-info-text')).toBeNull();
  });

  it('shows the summary loading state when summary is fetching', () => {
    const { useExpenseSummary } = require('../../../hooks/useExpenseSummary');
    useExpenseSummary.mockReturnValue({
      ...mockUseExpenseSummaryReturn,
      loading: true,
      data: null,
    });
    const { queryByText } = render(<StatisticsScreen />);
    expect(queryByText('Bilan des dépenses')).toBeNull();
  });

  it('shows the summary error state when summary fails', () => {
    const { useExpenseSummary } = require('../../../hooks/useExpenseSummary');
    useExpenseSummary.mockReturnValue({
      ...mockUseExpenseSummaryReturn,
      data: null,
      error: 'boom',
    });
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText(/Bilan indisponible/)).toBeTruthy();
    expect(getByText(/boom/)).toBeTruthy();
  });

  it('still renders the category breakdown (untouched by CRM-187)', () => {
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Répartition par catégorie')).toBeTruthy();
    expect(getByText('Streaming')).toBeTruthy();
    expect(getByText('23.98€')).toBeTruthy();
    expect(getByText('Sport')).toBeTruthy();
  });

  it('shows the empty category state when no events match the period', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({
      ...mockUseStatisticsReturn,
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

  it('shows the screen loading state when statistics are loading', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({ ...mockUseStatisticsReturn, loading: true });
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Chargement des statistiques...')).toBeTruthy();
  });

  it('shows the screen error state when statistics fail', () => {
    const { useStatistics } = require('../../../hooks/useStatistics');
    useStatistics.mockReturnValue({ ...mockUseStatisticsReturn, error: 'Network Error' });
    const { getByText } = render(<StatisticsScreen />);
    expect(getByText('Erreur : Network Error')).toBeTruthy();
  });
});
