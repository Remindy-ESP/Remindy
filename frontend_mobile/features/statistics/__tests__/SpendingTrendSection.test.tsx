import React from 'react';
import { render } from '@testing-library/react-native';
import { SpendingTrendSection } from '../components/SpendingTrendSection';
import { useComparison } from '../hooks/useComparison';

jest.mock('../hooks/useComparison', () => ({
  useComparison: jest.fn(),
}));

const mockedHook = useComparison as jest.MockedFunction<typeof useComparison>;

const range = {
  start: new Date('2026-05-01T00:00:00Z'),
  end: new Date('2026-06-01T00:00:00Z'),
  previousStart: new Date('2026-04-01T00:00:00Z'),
  previousEnd: new Date('2026-05-01T00:00:00Z'),
};

function setHook(overrides: Partial<ReturnType<typeof useComparison>> = {}) {
  mockedHook.mockReturnValue({
    data: null,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

describe('SpendingTrendSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the loading state', () => {
    setHook({ loading: true });
    const { getByTestId } = render(<SpendingTrendSection range={range} />);
    expect(getByTestId('spending-trend-section-loading')).toBeTruthy();
  });

  it('renders the error state', () => {
    setHook({ error: 'boom' });
    const { getByTestId } = render(<SpendingTrendSection range={range} />);
    expect(getByTestId('spending-trend-section-error')).toBeTruthy();
  });

  it('renders the empty state when there is no data', () => {
    setHook({ data: null });
    const { getByTestId } = render(<SpendingTrendSection range={range} />);
    expect(getByTestId('spending-trend-section-empty')).toBeTruthy();
  });

  it('renders the chart with two points when data is present', () => {
    setHook({
      data: {
        current: { start: '2026-05-01T00:00:00.000Z', end: '2026-06-01T00:00:00.000Z', total: 80 },
        previous: { start: '2026-04-01T00:00:00.000Z', end: '2026-05-01T00:00:00.000Z', total: 50 },
        delta: 30,
        percentageChange: 60,
        trend: 'up',
      },
    });
    const { getByTestId } = render(<SpendingTrendSection range={range} />);
    expect(getByTestId('spending-trend-chart-point-0')).toBeTruthy();
    expect(getByTestId('spending-trend-chart-point-1')).toBeTruthy();
  });
});

describe('ComparisonSection BarChart integration', () => {
  it('renders the bar chart when comparison data is present', () => {
    jest.isolateModules(() => {
      jest.doMock('../hooks/useComparison', () => ({
        useComparison: () => ({
          data: {
            current: { start: '2026-05-01', end: '2026-06-01', total: 80 },
            previous: { start: '2026-04-01', end: '2026-05-01', total: 50 },
            delta: 30,
            percentageChange: 60,
            trend: 'up',
          },
          loading: false,
          error: null,
          refetch: jest.fn(),
        }),
      }));
      const { ComparisonSection } = require('../components/ComparisonSection');
      const { getByTestId } = render(<ComparisonSection range={range} />);
      expect(getByTestId('comparison-bar-chart-bar-0')).toBeTruthy();
      expect(getByTestId('comparison-bar-chart-bar-1')).toBeTruthy();
    });
  });
});
