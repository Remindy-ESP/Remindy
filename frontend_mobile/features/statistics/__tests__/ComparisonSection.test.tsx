import React from 'react';
import { render } from '@testing-library/react-native';
import { ComparisonSection } from '../components/ComparisonSection';
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

describe('ComparisonSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the loading state', () => {
    setHook({ loading: true });
    const { getByTestId } = render(<ComparisonSection range={range} />);
    expect(getByTestId('comparison-loading')).toBeTruthy();
  });

  it('shows an error state', () => {
    setHook({ error: 'boom' });
    const { getByTestId, getByText } = render(<ComparisonSection range={range} />);
    expect(getByTestId('comparison-error')).toBeTruthy();
    expect(getByText(/Erreur : boom/)).toBeTruthy();
  });

  it('renders an up trend with the increase narrative', () => {
    setHook({
      data: {
        current: { start: '2026-05-01', end: '2026-06-01', total: 60 },
        previous: { start: '2026-04-01', end: '2026-05-01', total: 40 },
        delta: 20,
        percentageChange: 50,
        trend: 'up',
      },
    });
    const { getByText } = render(<ComparisonSection range={range} />);
    expect(getByText(/↑/)).toBeTruthy();
    expect(getByText(/\+50% vs période précédente/)).toBeTruthy();
    expect(getByText(/Vous avez dépensé/)).toBeTruthy();
  });

  it('renders a down trend with the savings narrative', () => {
    setHook({
      data: {
        current: { start: '2026-05-01', end: '2026-06-01', total: 30 },
        previous: { start: '2026-04-01', end: '2026-05-01', total: 50 },
        delta: -20,
        percentageChange: -40,
        trend: 'down',
      },
    });
    const { getByText } = render(<ComparisonSection range={range} />);
    expect(getByText(/↓/)).toBeTruthy();
    expect(getByText(/-40% vs période précédente/)).toBeTruthy();
    expect(getByText(/Vous avez économisé/)).toBeTruthy();
  });

  it('renders a stable trend with the stable narrative', () => {
    setHook({
      data: {
        current: { start: '2026-05-01', end: '2026-06-01', total: 50 },
        previous: { start: '2026-04-01', end: '2026-05-01', total: 50 },
        delta: 0,
        percentageChange: 0,
        trend: 'stable',
      },
    });
    const { getByText } = render(<ComparisonSection range={range} />);
    expect(getByText(/Stable vs période précédente/)).toBeTruthy();
    expect(getByText(/Vos dépenses sont stables/)).toBeTruthy();
  });

  it('renders the from-zero narrative when previous total is zero and current > 0', () => {
    setHook({
      data: {
        current: { start: '2026-05-01', end: '2026-06-01', total: 10 },
        previous: { start: '2026-04-01', end: '2026-05-01', total: 0 },
        delta: 10,
        percentageChange: 100,
        trend: 'up',
      },
    });
    const { getByText } = render(<ComparisonSection range={range} />);
    expect(getByText(/Aucune dépense lors de la période précédente/)).toBeTruthy();
  });
});
