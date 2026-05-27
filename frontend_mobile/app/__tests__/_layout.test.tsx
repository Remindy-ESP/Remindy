import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import RootLayout, { ErrorBoundary } from '../_layout';
import { AppStatusScreenMock } from './testUtils';

jest.mock('expo-router', () => ({
  Stack: Object.assign(
    ({ children }: any) => {
      const { View } = require('react-native');
      return <View>{children}</View>;
    },
    {
      Screen: ({ name }: any) => {
        const { View } = require('react-native');
        return <View testID={`screen-${name}`} />;
      },
    }
  ),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-navigation-bar', () => ({
  setBehaviorAsync: jest.fn().mockResolvedValue(undefined),
  setVisibilityAsync: jest.fn().mockResolvedValue(undefined),
  setBackgroundColorAsync: jest.fn().mockResolvedValue(undefined),
  setButtonStyleAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/modules/auth/application/AuthContext', () => ({
  AuthProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/features/coach-marks/CoachMarksContext', () => ({
  CoachMarksProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/shared/ui/system/AppStatusScreen', () => {
  const { AppStatusScreenMock } = require('./testUtils');
  return AppStatusScreenMock;
});

jest.mock('@/shared/ui/system/CoachMarksOverlay', () => () => null);

jest.mock('@/context/ToastContext', () => ({
  ToastProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  toast: Object.assign(jest.fn(), { error: jest.fn(), success: jest.fn(), info: jest.fn() }),
}));

jest.mock('@/context/ConfirmContext', () => ({
  ConfirmProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  showConfirm: jest.fn(),
}));

jest.mock('@/context/ActionSheetContext', () => ({
  ActionSheetProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
  showActionSheet: jest.fn(),
}));

jest.mock('@/context/I18nContext', () => ({
  I18nProvider: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

describe('RootLayout', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders on android and calls navigation bar APIs', async () => {
    const NavigationBar = require('expo-navigation-bar');
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', writable: true });

    render(<RootLayout />);

    // Allow useEffect to run
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(NavigationBar.setBehaviorAsync).toHaveBeenCalledWith('overlay-swipe');
    expect(NavigationBar.setVisibilityAsync).toHaveBeenCalledWith('hidden');
    expect(NavigationBar.setBackgroundColorAsync).toHaveBeenCalledWith('#11112A');
    expect(NavigationBar.setButtonStyleAsync).toHaveBeenCalledWith('light');

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });

  it('does not call navigation bar APIs on ios', async () => {
    const NavigationBar = require('expo-navigation-bar');
    jest.clearAllMocks();
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

    render(<RootLayout />);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(NavigationBar.setBehaviorAsync).not.toHaveBeenCalled();

    Object.defineProperty(Platform, 'OS', { value: originalOS, writable: true });
  });
});

describe('ErrorBoundary', () => {
  it('renders without crashing', () => {
    const mockRetry = jest.fn();
    const { toJSON } = render(<ErrorBoundary retry={mockRetry} error={new Error('test')} />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays 500 error code', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(<ErrorBoundary retry={mockRetry} error={new Error('test')} />);
    expect(getByText('500')).toBeTruthy();
  });

  it('displays error title', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(<ErrorBoundary retry={mockRetry} error={new Error('test')} />);
    expect(getByText('Une erreur est survenue')).toBeTruthy();
  });

  it('calls retry when retry button is pressed', () => {
    const mockRetry = jest.fn();
    const { getByTestId } = render(<ErrorBoundary retry={mockRetry} error={new Error('test')} />);
    const retryButton = getByTestId('error-500-retry-button');
    fireEvent.press(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });
});
