import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PeriodFilterTabs } from '../PeriodFilterTabs';

describe('PeriodFilterTabs', () => {
  it('renders all four period tabs with French labels', () => {
    const { getByText, getByTestId } = render(
      <PeriodFilterTabs selectedPeriod="month" onPeriodChange={() => {}} />,
    );
    expect(getByText('Ce jour')).toBeTruthy();
    expect(getByText('Semaine')).toBeTruthy();
    expect(getByText('Mensuel')).toBeTruthy();
    expect(getByText('Année')).toBeTruthy();
    expect(getByTestId('period-day')).toBeTruthy();
    expect(getByTestId('period-week')).toBeTruthy();
    expect(getByTestId('period-month')).toBeTruthy();
    expect(getByTestId('period-year')).toBeTruthy();
  });

  it('calls onPeriodChange with the pressed period key', () => {
    const onPeriodChange = jest.fn();
    const { getByTestId } = render(
      <PeriodFilterTabs selectedPeriod="month" onPeriodChange={onPeriodChange} />,
    );
    fireEvent.press(getByTestId('period-day'));
    fireEvent.press(getByTestId('period-week'));
    fireEvent.press(getByTestId('period-year'));
    expect(onPeriodChange).toHaveBeenNthCalledWith(1, 'day');
    expect(onPeriodChange).toHaveBeenNthCalledWith(2, 'week');
    expect(onPeriodChange).toHaveBeenNthCalledWith(3, 'year');
  });

  it('applies active styling to the selected tab and inactive styling to the others', () => {
    const { getByTestId } = render(
      <PeriodFilterTabs selectedPeriod="week" onPeriodChange={() => {}} />,
    );
    const activeTab = getByTestId('period-week');
    const inactiveTab = getByTestId('period-month');
    const activeStyle = Array.isArray(activeTab.props.style)
      ? Object.assign({}, ...activeTab.props.style)
      : activeTab.props.style;
    const inactiveStyle = Array.isArray(inactiveTab.props.style)
      ? Object.assign({}, ...inactiveTab.props.style)
      : inactiveTab.props.style;
    expect(activeStyle.backgroundColor).toBe('#000');
    expect(inactiveStyle.backgroundColor).toBe('transparent');
  });
});
