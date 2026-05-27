import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryDropdown from '../CategoryDropdown';
import type { Category } from '@/services/api';

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat1',
  name: 'Streaming',
  icon: 'play',
  color: '#FF0000',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('CategoryDropdown', () => {
  const defaultProps = {
    categories: [],
    emptyLabel: 'No categories',
    allLabel: 'All',
    onSelectAll: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the empty label when categories list is empty', () => {
    const { getByText } = render(<CategoryDropdown {...defaultProps} />);
    expect(getByText('No categories')).toBeTruthy();
  });

  it('does not render the "All" button when categories list is empty', () => {
    const { queryByText } = render(<CategoryDropdown {...defaultProps} />);
    expect(queryByText('All')).toBeNull();
  });

  it('renders the "All" button and all category items when categories are provided', () => {
    const categories = [
      makeCategory({ id: 'cat1', name: 'Streaming' }),
      makeCategory({ id: 'cat2', name: 'Music' }),
    ];
    const { getByText } = render(
      <CategoryDropdown {...defaultProps} categories={categories} />
    );
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Streaming')).toBeTruthy();
    expect(getByText('Music')).toBeTruthy();
  });

  it('calls onSelectAll when the "All" button is pressed', () => {
    const onSelectAll = jest.fn();
    const categories = [makeCategory()];
    const { getByText } = render(
      <CategoryDropdown
        {...defaultProps}
        categories={categories}
        onSelectAll={onSelectAll}
      />
    );
    fireEvent.press(getByText('All'));
    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with the category name when a category item is pressed', () => {
    const onSelect = jest.fn();
    const categories = [makeCategory({ id: 'cat1', name: 'Streaming' })];
    const { getByText } = render(
      <CategoryDropdown
        {...defaultProps}
        categories={categories}
        onSelect={onSelect}
      />
    );
    fireEvent.press(getByText('Streaming'));
    expect(onSelect).toHaveBeenCalledWith('Streaming');
  });

  it('calls onSelect with the correct name for each distinct category', () => {
    const onSelect = jest.fn();
    const categories = [
      makeCategory({ id: 'cat1', name: 'Streaming' }),
      makeCategory({ id: 'cat2', name: 'Music' }),
      makeCategory({ id: 'cat3', name: 'Health' }),
    ];
    const { getByText } = render(
      <CategoryDropdown
        {...defaultProps}
        categories={categories}
        onSelect={onSelect}
      />
    );
    fireEvent.press(getByText('Music'));
    expect(onSelect).toHaveBeenCalledWith('Music');
    fireEvent.press(getByText('Health'));
    expect(onSelect).toHaveBeenCalledWith('Health');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('does not call onSelect when "All" is pressed', () => {
    const onSelect = jest.fn();
    const categories = [makeCategory()];
    const { getByText } = render(
      <CategoryDropdown
        {...defaultProps}
        categories={categories}
        onSelect={onSelect}
      />
    );
    fireEvent.press(getByText('All'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders the custom emptyLabel text', () => {
    const { getByText } = render(
      <CategoryDropdown {...defaultProps} emptyLabel="Aucune catégorie" />
    );
    expect(getByText('Aucune catégorie')).toBeTruthy();
  });

  it('renders a single category correctly without error', () => {
    const categories = [makeCategory({ id: 'solo', name: 'Solo Category' })];
    const { getByText } = render(
      <CategoryDropdown {...defaultProps} categories={categories} />
    );
    expect(getByText('Solo Category')).toBeTruthy();
  });
});
