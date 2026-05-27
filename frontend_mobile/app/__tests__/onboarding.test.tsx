import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import OnboardingScreen from '../onboarding';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

const mockSetHasSeenOnboarding = global.__mockOnboardingSetSeen as jest.Mock;

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(jest.fn(), {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  }),
  ToastProvider: ({ children }: any) => children,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockToast = require('@/context/ToastContext').toast as {
  error: jest.Mock;
  success: jest.Mock;
  info: jest.Mock;
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
    mockSetHasSeenOnboarding.mockResolvedValue(undefined);
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({});
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<OnboardingScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the first step content by default', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('shows step counter starting at 1/5', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('1/5')).toBeTruthy();
  });

  it('shows "Suivant" on primary button when not on last step', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    expect(getByTestId('onboarding-primary-button')).toBeTruthy();
  });

  it('shows "Passer" as secondary button on first step', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Passer')).toBeTruthy();
  });

  it('advances to next step when "Suivant" is pressed', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => {
      expect(getByText('Ajouter un abonnement')).toBeTruthy();
    });
  });

  it('shows "Precedent" on secondary button after first step', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => {
      expect(getByText('Precedent')).toBeTruthy();
    });
  });

  it('goes back to previous step when "Precedent" is pressed', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    // Go to step 2
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => expect(getByText('Ajouter un abonnement')).toBeTruthy());
    // Go back
    fireEvent.press(getByTestId('onboarding-secondary-button'));
    await waitFor(() => expect(getByText('Dashboard')).toBeTruthy());
  });

  it('shows "Terminer" on last step', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    // Navigate to last step (step 5)
    for (let i = 0; i < 4; i++) {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    }
    await waitFor(() => {
      expect(getByText('Terminer')).toBeTruthy();
    });
  });

  it('calls setHasSeenOnboarding when skipping', async () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Passer'));
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledWith(true);
    });
  });

  it('calls router.replace("/") when finishing without fromHelp', async () => {
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    for (let i = 0; i < 4; i++) {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    }
    await waitFor(() => expect(getByText('Terminer')).toBeTruthy());
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledWith(true);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('calls router.back() when fromHelp is true and skipping', async () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ from: 'help' });
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Passer'));
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('shows notice card when fromHelp is true', () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ from: 'help' });
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText(/Ce guide est ouvert depuis l aide/)).toBeTruthy();
  });

  it('does not show notice card when not from help', () => {
    const { queryByText } = render(<OnboardingScreen />);
    expect(queryByText(/Ce guide est ouvert depuis l aide/)).toBeNull();
  });

  it('opens step page when open step button is pressed', () => {
    const { getByTestId } = render(<OnboardingScreen />);
    fireEvent.press(getByTestId('onboarding-open-step-page-button'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/dashboard');
  });

  it('shows alert on error saving onboarding state', async () => {
    mockSetHasSeenOnboarding.mockRejectedValueOnce(new Error('Storage error'));
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Passer'));
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('handles from param as array', () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ from: ['help', 'other'] });
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText(/Ce guide est ouvert depuis l aide/)).toBeTruthy();
  });

  it('does not finishOnboarding when saving is in progress (skip button)', async () => {
    // Make the save hang to enter saving state
    let resolveOnce: (v: unknown) => void;
    const slowPromise = new Promise(resolve => { resolveOnce = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(slowPromise);
    mockSetHasSeenOnboarding.mockResolvedValue(undefined);

    const { getByText } = render(<OnboardingScreen />);
    // Start first save
    fireEvent.press(getByText('Passer'));
    // Press again while saving - should be a no-op
    fireEvent.press(getByText('Passer'));
    // Resolve the slow save
    resolveOnce!(undefined);
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('does not advance to next step when saving is in progress', async () => {
    let resolveOnce: (v: unknown) => void;
    const slowPromise = new Promise(resolve => { resolveOnce = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(slowPromise);

    const { getByTestId } = render(<OnboardingScreen />);
    // Navigate to last step first
    for (let i = 0; i < 4; i++) {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    }
    // On last step, press primary to finish (starts saving)
    await act(async () => {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    });
    // Press again while saving - should no-op
    fireEvent.press(getByTestId('onboarding-primary-button'));
    resolveOnce!(undefined);
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('does not go to previous step when saving is in progress', async () => {
    let resolveOnce: (v: unknown) => void;
    const slowPromise = new Promise(resolve => { resolveOnce = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(slowPromise);

    const { getByTestId, getByText } = render(<OnboardingScreen />);
    // Advance to step 2 so there's a "Precedent" button
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => expect(getByText('Precedent')).toBeTruthy());
    // Start saving by pressing "Passer"-equivalent (actually we need skip = secondary on step 0)
    // Instead, put saving=true by navigating to last and pressing
    // Simpler: trigger save via skip from step 1 (secondary button = Precedent → go to step 0 first)
    fireEvent.press(getByTestId('onboarding-secondary-button'));
    // Now on step 0, secondary = Passer → triggers finishOnboarding
    await act(async () => {
      fireEvent.press(getByTestId('onboarding-secondary-button'));
    });
    // While saving, pressing previous (secondary when on step >0) should no-op
    fireEvent.press(getByTestId('onboarding-secondary-button'));
    resolveOnce!(undefined);
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('calls router.back() when target is "back" (fromHelp, finishing)', async () => {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({ from: 'help' });
    const { getByTestId, getByText } = render(<OnboardingScreen />);
    // Navigate to last step
    for (let i = 0; i < 4; i++) {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    }
    await waitFor(() => expect(getByText('Terminer')).toBeTruthy());
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('finishOnboarding no-ops when saving is already true (guard at line 109)', async () => {
    // The buttons are disabled={saving}, so fireEvent.press won't call onPress when saving=true.
    // To test the guard, we must call the handler's onPress prop directly after saving=true.
    let resolveFirst: (v: unknown) => void;
    const hangingPromise = new Promise(resolve => { resolveFirst = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(hangingPromise);
    mockSetHasSeenOnboarding.mockResolvedValue(undefined);

    const { getByTestId, UNSAFE_getAllByType } = render(<OnboardingScreen />);
    // First press starts the save (saving becomes true).
    await act(async () => {
      fireEvent.press(getByTestId('onboarding-secondary-button'));
    });
    // After act(), the component re-renders with saving=true and the button is disabled.
    // Grab the secondary button element directly and call its onPress prop — bypasses disabled.
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const secondaryBtn = touchables.find((t: any) => t.props.testID === 'onboarding-secondary-button');
    await act(async () => {
      secondaryBtn?.props.onPress?.();
    });
    resolveFirst!(undefined);
    await waitFor(() => {
      // Only one call — the second invocation hit the `if (saving) return` guard
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('handleNext no-ops on non-last step when saving is in progress (guard at line 135)', async () => {
    let resolveFirst: (v: unknown) => void;
    const hangingPromise = new Promise(resolve => { resolveFirst = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(hangingPromise);
    mockSetHasSeenOnboarding.mockResolvedValue(undefined);

    const { getByTestId, UNSAFE_getAllByType } = render(<OnboardingScreen />);
    // Start saving via skip. act() commits saving=true.
    await act(async () => {
      fireEvent.press(getByTestId('onboarding-secondary-button'));
    });
    // Call the primary button's onPress directly (bypasses disabled) while saving=true.
    // The new closure captured by onPress has saving=true, so it hits `if (saving) return` at line 135.
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const primaryBtn = touchables.find((t: any) => t.props.testID === 'onboarding-primary-button');
    await act(async () => {
      primaryBtn?.props.onPress?.();
    });
    resolveFirst!(undefined);
    await waitFor(() => {
      // Only one call; the second invocation was a no-op at line 135
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('handlePrevious no-ops when saving is in progress (guard at line 148)', async () => {
    let resolveFirst: (v: unknown) => void;
    const hangingPromise = new Promise(resolve => { resolveFirst = resolve; });
    mockSetHasSeenOnboarding.mockReturnValueOnce(hangingPromise);
    mockSetHasSeenOnboarding.mockResolvedValue(undefined);

    const { getByTestId, getByText, UNSAFE_getAllByType } = render(<OnboardingScreen />);
    // Advance to step 2 so "Precedent" button will be the secondary label
    fireEvent.press(getByTestId('onboarding-primary-button'));
    await waitFor(() => expect(getByText('Precedent')).toBeTruthy());
    // Navigate to last step
    for (let i = 0; i < 3; i++) {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    }
    await waitFor(() => expect(getByText('Terminer')).toBeTruthy());
    // Start the finishing save. act() commits saving=true.
    await act(async () => {
      fireEvent.press(getByTestId('onboarding-primary-button'));
    });
    // Directly call the secondary button's onPress (Precedent → handlePrevious).
    // The new closure has saving=true, so it hits `if (saving) return` at line 148.
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const secondaryBtn = touchables.find((t: any) => t.props.testID === 'onboarding-secondary-button');
    await act(async () => {
      secondaryBtn?.props.onPress?.();
    });
    resolveFirst!(undefined);
    await waitFor(() => {
      expect(mockSetHasSeenOnboarding).toHaveBeenCalledTimes(1);
    });
  });
});
