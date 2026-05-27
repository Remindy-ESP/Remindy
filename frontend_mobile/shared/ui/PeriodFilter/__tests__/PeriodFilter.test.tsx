import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PeriodFilter } from '../PeriodFilter';

describe('PeriodFilter', () => {
  it('renders all default options', () => {
    const { getByTestId } = render(<PeriodFilter value="month" onChange={() => {}} />);
    expect(getByTestId('period-filter-day')).toBeTruthy();
    expect(getByTestId('period-filter-week')).toBeTruthy();
    expect(getByTestId('period-filter-month')).toBeTruthy();
    expect(getByTestId('period-filter-year')).toBeTruthy();
  });

  it('marks the active option as selected', () => {
    const { getByTestId } = render(<PeriodFilter value="week" onChange={() => {}} />);
    const active = getByTestId('period-filter-week');
    expect(active.props.accessibilityState).toEqual({ selected: true });

    const inactive = getByTestId('period-filter-month');
    expect(inactive.props.accessibilityState).toEqual({ selected: false });
  });

  it('invokes onChange when an option is pressed', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<PeriodFilter value="month" onChange={onChange} />);
    fireEvent.press(getByTestId('period-filter-week'));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('renders the localized label for each option', () => {
    const { getByText } = render(<PeriodFilter value="month" onChange={() => {}} />);
    expect(getByText('Ce jour')).toBeTruthy();
    expect(getByText('Semaine')).toBeTruthy();
    expect(getByText('Mensuel')).toBeTruthy();
    expect(getByText('Année')).toBeTruthy();
  });

  it('honours custom options', () => {
    const { queryByTestId } = render(
      <PeriodFilter value="month" onChange={() => {}} options={['month', 'year']} />,
    );
    expect(queryByTestId('period-filter-day')).toBeNull();
    expect(queryByTestId('period-filter-month')).toBeTruthy();
  });

  it('uses a custom testID prefix', () => {
    const { getByTestId } = render(
      <PeriodFilter value="month" onChange={() => {}} testID="custom" />,
    );
    expect(getByTestId('custom-month')).toBeTruthy();
  });
});
