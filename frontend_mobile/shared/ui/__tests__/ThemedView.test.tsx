import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemedView } from '@/shared/ui/ThemedView';

// Mock useThemeColor to return a predictable background color
jest.mock('@/shared/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#151718'),
}));

// Mock useColorScheme so it doesn't access native modules
jest.mock('@/shared/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'dark'),
}));

describe('ThemedView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    (useThemeColor as jest.Mock).mockReturnValue('#151718');
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ThemedView />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Child content</Text>
      </ThemedView>
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('applies the background color returned by useThemeColor', () => {
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    (useThemeColor as jest.Mock).mockReturnValue('#abcdef');

    const { toJSON } = render(<ThemedView testID="themed-view" />);
    const root = toJSON() as any;
    const flatStyle = [].concat(...[root.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.backgroundColor).toBe('#abcdef');
  });

  it('passes lightColor and darkColor to useThemeColor', () => {
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    render(<ThemedView lightColor="#ffffff" darkColor="#000000" />);
    expect(useThemeColor).toHaveBeenCalledWith(
      { light: '#ffffff', dark: '#000000' },
      'background'
    );
  });

  it('merges additional style prop with backgroundColor', () => {
    const { toJSON } = render(<ThemedView style={{ padding: 20 }} />);
    const root = toJSON() as any;
    const flatStyle = [].concat(...[root.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.padding).toBe(20);
    expect(merged.backgroundColor).toBeTruthy();
  });

  it('forwards additional props to the underlying View', () => {
    const { getByTestId } = render(
      <ThemedView testID="my-view">
        <Text>inside</Text>
      </ThemedView>
    );
    expect(getByTestId('my-view')).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>First</Text>
        <Text>Second</Text>
      </ThemedView>
    );
    expect(getByText('First')).toBeTruthy();
    expect(getByText('Second')).toBeTruthy();
  });
});
