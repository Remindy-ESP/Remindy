import React from 'react';
import { render } from '@testing-library/react-native';
import { LineChart } from '../LineChart';
import { PieChart } from '../PieChart';
import { BarChart } from '../BarChart';

describe('LineChart', () => {
  it('renders an empty placeholder with no data', () => {
    const { getByTestId } = render(<LineChart data={[]} />);
    expect(getByTestId('line-chart-empty')).toBeTruthy();
  });

  it('renders one column per point', () => {
    const { getByTestId } = render(
      <LineChart
        data={[
          { label: 'Jan', value: 10 },
          { label: 'Feb', value: 20 },
          { label: 'Mar', value: 15 },
        ]}
      />,
    );
    expect(getByTestId('line-chart-point-0')).toBeTruthy();
    expect(getByTestId('line-chart-point-1')).toBeTruthy();
    expect(getByTestId('line-chart-point-2')).toBeTruthy();
  });

  it('honours a custom testID', () => {
    const { getByTestId } = render(
      <LineChart testID="trend" data={[{ label: 'Jan', value: 1 }]} />,
    );
    expect(getByTestId('trend-point-0')).toBeTruthy();
  });
});

describe('PieChart', () => {
  it('renders an empty placeholder when totals sum to zero', () => {
    const { getByTestId } = render(
      <PieChart data={[{ label: 'A', value: 0, color: '#fff' }]} />,
    );
    expect(getByTestId('pie-chart-empty')).toBeTruthy();
  });

  it('renders one slice per category with the legend', () => {
    const { getByTestId, getByText } = render(
      <PieChart
        data={[
          { label: 'Food', value: 30, color: '#ef4444' },
          { label: 'Transport', value: 20, color: '#3b82f6' },
        ]}
      />,
    );
    expect(getByTestId('pie-chart-slice-0')).toBeTruthy();
    expect(getByTestId('pie-chart-slice-1')).toBeTruthy();
    expect(getByText(/Food · 60%/)).toBeTruthy();
    expect(getByText(/Transport · 40%/)).toBeTruthy();
  });
});

describe('BarChart', () => {
  it('renders an empty placeholder with no bars', () => {
    const { getByTestId } = render(<BarChart bars={[]} />);
    expect(getByTestId('bar-chart-empty')).toBeTruthy();
  });

  it('renders one entry per bar', () => {
    const { getByTestId } = render(
      <BarChart
        bars={[
          { label: 'Current', value: 50 },
          { label: 'Previous', value: 40 },
        ]}
      />,
    );
    expect(getByTestId('bar-chart-bar-0')).toBeTruthy();
    expect(getByTestId('bar-chart-bar-1')).toBeTruthy();
  });

  it('uses a per-bar color when provided', () => {
    const { getByTestId } = render(
      <BarChart
        bars={[
          { label: 'A', value: 10, color: '#ff0000' },
          { label: 'B', value: 5 },
        ]}
      />,
    );
    const first = getByTestId('bar-chart-bar-0');
    expect(first).toBeTruthy();
  });
});
