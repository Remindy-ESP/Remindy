import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ChartContainer } from '../ChartContainer';

describe('ChartContainer', () => {
  it('renders the title and subtitle when provided', () => {
    const { getByText } = render(
      <ChartContainer title="Trend" subtitle="Sub">
        <Text>child</Text>
      </ChartContainer>,
    );
    expect(getByText('Trend')).toBeTruthy();
    expect(getByText('Sub')).toBeTruthy();
  });

  it('renders the loading state when loading is true', () => {
    const { getByTestId } = render(
      <ChartContainer loading>
        <Text>child</Text>
      </ChartContainer>,
    );
    expect(getByTestId('chart-container-loading')).toBeTruthy();
  });

  it('renders the error state when error is set', () => {
    const { getByTestId, getByText } = render(
      <ChartContainer error="boom">
        <Text>child</Text>
      </ChartContainer>,
    );
    expect(getByTestId('chart-container-error')).toBeTruthy();
    expect(getByText(/Erreur : boom/)).toBeTruthy();
  });

  it('renders the empty state when empty is true', () => {
    const { getByTestId } = render(
      <ChartContainer empty>
        <Text>child</Text>
      </ChartContainer>,
    );
    expect(getByTestId('chart-container-empty')).toBeTruthy();
  });

  it('renders children when no special state is set', () => {
    const { getByText } = render(
      <ChartContainer>
        <Text>actual chart</Text>
      </ChartContainer>,
    );
    expect(getByText('actual chart')).toBeTruthy();
  });
});
