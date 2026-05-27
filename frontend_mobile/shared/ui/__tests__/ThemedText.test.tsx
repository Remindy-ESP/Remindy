import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '@/shared/ui/ThemedText';

// Mock useThemeColor to return a predictable color value
jest.mock('@/shared/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#000000'),
}));

// Mock useColorScheme so it doesn't access native modules
jest.mock('@/shared/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('ThemedText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    (useThemeColor as jest.Mock).mockReturnValue('#000000');
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ThemedText>Hello</ThemedText>);
    expect(toJSON()).toBeTruthy();
  });

  it('displays children text correctly', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies default type styles when no type is specified', () => {
    const { getByText } = render(<ThemedText>Default</ThemedText>);
    const node = getByText('Default');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.fontSize).toBe(16);
    expect(merged.lineHeight).toBe(24);
  });

  it('applies title type styles', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    const node = getByText('Title Text');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.fontSize).toBe(32);
    expect(merged.fontWeight).toBe('bold');
  });

  it('applies defaultSemiBold type styles', () => {
    const { getByText } = render(<ThemedText type="defaultSemiBold">SemiBold</ThemedText>);
    const node = getByText('SemiBold');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.fontWeight).toBe('600');
  });

  it('applies subtitle type styles', () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle</ThemedText>);
    const node = getByText('Subtitle');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.fontSize).toBe(20);
    expect(merged.fontWeight).toBe('bold');
  });

  it('applies link type styles', () => {
    const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
    const node = getByText('Link Text');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.fontSize).toBe(16);
    expect(merged.lineHeight).toBe(30);
  });

  it('applies the color returned by useThemeColor', () => {
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    (useThemeColor as jest.Mock).mockReturnValue('#ff0000');

    const { getByText } = render(<ThemedText>Colored Text</ThemedText>);
    const node = getByText('Colored Text');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.color).toBe('#ff0000');
  });

  it('passes lightColor and darkColor props to useThemeColor', () => {
    const { useThemeColor } = require('@/shared/hooks/useThemeColor');
    render(
      <ThemedText lightColor="#ffffff" darkColor="#111111">
        Themed
      </ThemedText>
    );
    expect(useThemeColor).toHaveBeenCalledWith(
      { light: '#ffffff', dark: '#111111' },
      'text'
    );
  });

  it('merges additional style prop with component styles', () => {
    const { getByText } = render(
      <ThemedText style={{ marginTop: 10 }}>Styled</ThemedText>
    );
    const node = getByText('Styled');
    const flatStyle = [].concat(...[node.props.style].flat());
    const merged = Object.assign({}, ...flatStyle.filter(Boolean));
    expect(merged.marginTop).toBe(10);
  });
});
