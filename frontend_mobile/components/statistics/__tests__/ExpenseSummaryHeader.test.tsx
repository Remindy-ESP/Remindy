import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ExpenseSummaryHeader } from '../ExpenseSummaryHeader';

describe('ExpenseSummaryHeader', () => {
  const baseProps = {
    periodLabel: 'Octobre 2025',
    totalAmount: 203.85,
    percentageChange: -3.5,
    trend: 'down' as const,
    comparisonLabel: 'Comparo M-1',
    onInfoPress: () => {},
  };

  it('renders the title, period label and the comparison badge label', () => {
    const { getByText, getByTestId } = render(<ExpenseSummaryHeader {...baseProps} />);
    expect(getByText('Bilan des dépenses')).toBeTruthy();
    expect(getByTestId('expense-period-label').props.children).toBe('Octobre 2025');
    expect(getByText('Comparo M-1')).toBeTruthy();
  });

  it('formats the total amount as French euro currency', () => {
    const { getByTestId } = render(<ExpenseSummaryHeader {...baseProps} />);
    const formatted = getByTestId('expense-total-amount').props.children as string;
    // fr-FR locale uses ',' as decimal separator and '€' as currency symbol.
    expect(formatted).toMatch(/203,85/);
    expect(formatted).toMatch(/€/);
  });

  it('formats zero amount as 0,00 €', () => {
    const { getByTestId } = render(
      <ExpenseSummaryHeader {...baseProps} totalAmount={0} />,
    );
    const formatted = getByTestId('expense-total-amount').props.children as string;
    expect(formatted).toMatch(/0,00/);
  });

  it('forwards onInfoPress through the comparison badge info icon', () => {
    const onInfoPress = jest.fn();
    const { getByTestId } = render(
      <ExpenseSummaryHeader {...baseProps} onInfoPress={onInfoPress} />,
    );
    fireEvent.press(getByTestId('comparison-info-button'));
    expect(onInfoPress).toHaveBeenCalledTimes(1);
  });
});
