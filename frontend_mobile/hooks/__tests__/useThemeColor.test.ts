import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '../useThemeColor';

// Mock useColorScheme to control what theme is active
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue('light');
  });

  it('returns color from props when light theme and light prop is provided', () => {
    const { result } = renderHook(() =>
      useThemeColor({ light: '#aabbcc', dark: '#112233' }, 'text')
    );
    expect(result.current).toBe('#aabbcc');
  });

  it('returns color from props when dark theme and dark prop is provided', () => {
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#aabbcc', dark: '#112233' }, 'text')
    );
    expect(result.current).toBe('#112233');
  });

  it('returns Colors.light.text when light theme and no props provided', () => {
    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );
    // Colors.light.text = '#11181C'
    expect(result.current).toBe('#11181C');
  });

  it('returns Colors.dark.text when dark theme and no props provided', () => {
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );
    // Colors.dark.text = '#ECEDEE'
    expect(result.current).toBe('#ECEDEE');
  });

  it('returns Colors.light.background when no props and light theme', () => {
    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );
    // Colors.light.background = '#fff'
    expect(result.current).toBe('#fff');
  });

  it('returns Colors.dark.background when no props and dark theme', () => {
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );
    // Colors.dark.background = '#151718'
    expect(result.current).toBe('#151718');
  });

  it('falls back to Colors when theme is null (defaults to light)', () => {
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue(null);

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );
    // null ?? 'light' → Colors.light.text
    expect(result.current).toBe('#11181C');
  });

  it('uses only the provided prop for the current theme', () => {
    // Only provide light prop, no dark
    const { result } = renderHook(() =>
      useThemeColor({ light: '#custom' }, 'text')
    );
    expect(result.current).toBe('#custom');
  });

  it('falls back to Colors when prop for current theme is missing', () => {
    const { useColorScheme } = require('@/hooks/useColorScheme');
    useColorScheme.mockReturnValue('dark');

    // Only provide light prop, no dark prop → should fall back to Colors.dark.text
    const { result } = renderHook(() =>
      useThemeColor({ light: '#custom' }, 'text')
    );
    expect(result.current).toBe('#ECEDEE');
  });
});
