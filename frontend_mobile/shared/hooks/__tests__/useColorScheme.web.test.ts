import { renderHook, act } from '@testing-library/react-native';
import { useColorScheme } from '@/shared/hooks/useColorScheme.web';

// The jest-expo preset mocks react-native fully.
// useColorScheme from react-native returns 'light' in the test environment.
// We test the web-specific wrapper which adds a hydration guard.

describe('useColorScheme (web)', () => {
  it('returns "light" synchronously before hydration useEffect runs', () => {
    // Before useEffect, hasHydrated=false → always returns 'light'
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
  });

  it('returns a color scheme value after hydration (useEffect runs)', async () => {
    const { result } = renderHook(() => useColorScheme());
    await act(async () => {});
    // After hydration, returns whatever useRNColorScheme returns
    // jest-expo environment returns null or 'light'; either is acceptable
    expect(['light', 'dark', null]).toContain(result.current);
  });

  it('returns defined value', async () => {
    const { result } = renderHook(() => useColorScheme());
    await act(async () => {});
    // The hook should return a value (not undefined)
    expect(result.current === undefined).toBe(false);
  });

  it('hook can be called multiple times', () => {
    // No errors thrown on repeated calls
    renderHook(() => useColorScheme());
    renderHook(() => useColorScheme());
    renderHook(() => useColorScheme());
  });
});
