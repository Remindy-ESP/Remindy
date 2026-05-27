import React from 'react';
import { render } from '@testing-library/react-native';
import { DailyExpensesSummary } from '../DailyExpensesSummary';
import type { Event } from '@/services/api';

// @expo/vector-icons: Ionicons renders nothing in tests
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// formatLongDate and formatCurrency are utility functions — mock them so tests
// are deterministic regardless of locale/date logic.
jest.mock('@/utils/format', () => ({
  formatLongDate: (_date: Date, _lang: string) => 'formatted-date',
  formatCurrency: (amount: number, _lang: string) => `${amount} €`,
}));

const makeEvent = (amount?: number): Event => ({
  id: 'evt1',
  title: 'Netflix',
  dueDate: '2024-02-01T00:00:00.000Z',
  status: 'scheduled',
  subscriptionId: 'sub1',
  userId: 'user1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  subscription: amount !== undefined
    ? {
        id: 'sub1',
        name: 'Netflix',
        amount,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: '2024-01-01T00:00:00.000Z',
        nextDueDate: '2024-02-01T00:00:00.000Z',
        status: 'active',
        userId: 'user1',
        createdAt: '',
        updatedAt: '',
      }
    : undefined,
});

describe('DailyExpensesSummary', () => {
  it('renders nothing when date is null', () => {
    const { toJSON } = render(
      <DailyExpensesSummary date={null} events={[]} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders the title translation key when date is provided', () => {
    // jest.setup.js resolves FR translations; the key maps to a French string.
    // We test for the key itself since we cannot guarantee exact locale output
    // without the full i18n setup — the setup mock returns the FR value or the key.
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={[]} />
    );
    // The component renders t('common.dailyExpenses.title')
    // The jest.setup i18n mock resolves this to the FR string or the key.
    expect(getByText(/dépenses|dailyExpenses/i)).toBeTruthy();
  });

  it('renders the formatted date string', () => {
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={[]} />
    );
    // formatLongDate is mocked to return 'formatted-date'
    expect(getByText('formatted-date')).toBeTruthy();
  });

  it('renders total amount of 0 when events array is empty', () => {
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={[]} />
    );
    // formatCurrency(0, 'fr') is mocked to '0 €'
    expect(getByText('0 €')).toBeTruthy();
  });

  it('renders the summed subscription amounts for provided events', () => {
    const events = [makeEvent(15), makeEvent(10)];
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={events} />
    );
    // 15 + 10 = 25 → mocked formatCurrency returns '25 €'
    expect(getByText('25 €')).toBeTruthy();
  });

  it('treats events with no subscription as 0 contribution to total', () => {
    const events = [makeEvent(20), makeEvent(undefined)];
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={events} />
    );
    // 20 + 0 = 20
    expect(getByText('20 €')).toBeTruthy();
  });

  it('renders a single event amount correctly', () => {
    const events = [makeEvent(9.99)];
    const { getByText } = render(
      <DailyExpensesSummary date="2024-02-15" events={events} />
    );
    expect(getByText('9.99 €')).toBeTruthy();
  });

  it('does not render when date is an empty string cast to null-ish (falsy)', () => {
    // The component checks `if (!date) return null`; empty string is falsy.
    const { toJSON } = render(
      <DailyExpensesSummary date={'' as unknown as null} events={[]} />
    );
    expect(toJSON()).toBeNull();
  });
});
