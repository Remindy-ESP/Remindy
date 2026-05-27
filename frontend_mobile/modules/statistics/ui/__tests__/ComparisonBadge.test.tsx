import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ComparisonBadge } from '../ComparisonBadge';

describe('ComparisonBadge', () => {
  it('renders the comparison label and formatted percentage', () => {
    const { getByText, getByTestId } = render(
      <ComparisonBadge
        label="Comparo M-1"
        percentageChange={-3.5}
        trend="down"
        onInfoPress={() => {}}
      />,
    );
    expect(getByText('Comparo M-1')).toBeTruthy();
    expect(getByTestId('comparison-percentage').props.children).toBe('-3.5%');
  });

  it('uses green for the down trend (savings)', () => {
    const { getByTestId } = render(
      <ComparisonBadge
        label="Comparo M-1"
        percentageChange={-3.5}
        trend="down"
        onInfoPress={() => {}}
      />,
    );
    const styles = getByTestId('comparison-percentage').props.style;
    const flat = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;
    expect(flat.color).toBe('#22c55e');
  });

  it('uses red for the up trend (increase) and prefixes a + sign', () => {
    const { getByTestId } = render(
      <ComparisonBadge
        label="Comparo M-1"
        percentageChange={12.4}
        trend="up"
        onInfoPress={() => {}}
      />,
    );
    expect(getByTestId('comparison-percentage').props.children).toBe('+12.4%');
    const styles = getByTestId('comparison-percentage').props.style;
    const flat = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;
    expect(flat.color).toBe('#ef4444');
  });

  it('uses gray for the stable trend', () => {
    const { getByTestId } = render(
      <ComparisonBadge
        label="Comparo M-1"
        percentageChange={0}
        trend="stable"
        onInfoPress={() => {}}
      />,
    );
    expect(getByTestId('comparison-percentage').props.children).toBe('0.0%');
    const styles = getByTestId('comparison-percentage').props.style;
    const flat = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;
    expect(flat.color).toBe('#888888');
  });

  it('fires onInfoPress when the info icon is pressed', () => {
    const onInfoPress = jest.fn();
    const { getByTestId } = render(
      <ComparisonBadge
        label="Comparo M-1"
        percentageChange={0}
        trend="stable"
        onInfoPress={onInfoPress}
      />,
    );
    fireEvent.press(getByTestId('comparison-info-button'));
    expect(onInfoPress).toHaveBeenCalledTimes(1);
  });
});
