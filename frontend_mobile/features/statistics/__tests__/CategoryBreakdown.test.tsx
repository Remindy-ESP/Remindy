import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryCard } from '../components/CategoryCard';
import { CategoryGrid } from '../components/CategoryGrid';
import {
  CategoryBreakdownItem,
  CategoryBreakdownSection,
} from '../components/CategoryBreakdownSection';

describe('CategoryCard', () => {
  it('renders the name and the rounded percent', () => {
    const { getByText } = render(
      <CategoryCard name="Food" color="#ef4444" amount={20} share={0.345} />,
    );
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('35%')).toBeTruthy();
  });

  it('clamps shares above 100% visually', () => {
    const { getByTestId } = render(
      <CategoryCard
        name="A"
        color="#fff"
        amount={10}
        share={1.5}
        testID="cat"
      />,
    );
    const bar = getByTestId('cat-bar');
    expect(bar.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
    );
  });

  it('renders the icon when provided', () => {
    const { getByText } = render(
      <CategoryCard
        name="Food"
        icon="🍕"
        color="#ef4444"
        amount={5}
        share={0.1}
      />,
    );
    expect(getByText('🍕')).toBeTruthy();
  });
});

describe('CategoryGrid', () => {
  it('renders one card per item', () => {
    const { getByTestId } = render(
      <CategoryGrid
        items={[
          { id: '1', name: 'A', color: '#fff', amount: 10, share: 0.5 },
          { id: '2', name: 'B', color: '#000', amount: 10, share: 0.5 },
        ]}
      />,
    );
    expect(getByTestId('category-grid-card-0')).toBeTruthy();
    expect(getByTestId('category-grid-card-1')).toBeTruthy();
  });
});

describe('CategoryBreakdownSection', () => {
  const items: CategoryBreakdownItem[] = [
    { id: '1', name: 'Food', color: '#ef4444', total: 60 },
    { id: '2', name: 'Transport', color: '#3b82f6', total: 40 },
  ];

  it('renders the pie chart and the grid when data is present', () => {
    const { getByTestId } = render(<CategoryBreakdownSection items={items} />);
    expect(getByTestId('category-breakdown-section-pie')).toBeTruthy();
    expect(getByTestId('category-breakdown-section-grid')).toBeTruthy();
  });

  it('renders the empty state when items are empty', () => {
    const { getByTestId } = render(<CategoryBreakdownSection items={[]} />);
    expect(getByTestId('category-breakdown-section-empty')).toBeTruthy();
  });

  it('forwards the loading state to the container', () => {
    const { getByTestId } = render(<CategoryBreakdownSection items={[]} loading />);
    expect(getByTestId('category-breakdown-section-loading')).toBeTruthy();
  });

  it('renders an error message when error is set', () => {
    const { getByTestId, getByText } = render(
      <CategoryBreakdownSection items={[]} error="boom" />,
    );
    expect(getByTestId('category-breakdown-section-error')).toBeTruthy();
    expect(getByText(/Erreur : boom/)).toBeTruthy();
  });
});
