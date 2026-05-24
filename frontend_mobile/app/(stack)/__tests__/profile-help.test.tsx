import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileHelpScreen from '../profile-help';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: jest.fn(),
  }),
}));

const mockStartTour = jest.fn();
jest.mock('@/features/coach-marks/CoachMarksContext', () => ({
  useCoachMarks: () => ({
    startTour: mockStartTour,
    isActive: false,
    currentIndex: 0,
    steps: [],
    currentStep: null,
    targets: {},
    registerTarget: jest.fn(),
    unregisterTarget: jest.fn(),
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    skipTour: jest.fn(),
    finishTour: jest.fn(),
  }),
}));

const mockResetOnboarding = jest.fn();
jest.mock('@/services/local/onboarding.service', () => ({
  __esModule: true,
  default: {
    hasSeenOnboarding: jest.fn(() => Promise.resolve(true)),
    setHasSeenOnboarding: jest.fn(() => Promise.resolve()),
    resetOnboarding: (...args: any[]) => mockResetOnboarding(...args),
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfileHelpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetOnboarding.mockResolvedValue(undefined);
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<ProfileHelpScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays the header title', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    expect(getByText('Aide')).toBeTruthy();
  });

  it('displays the header subtitle', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    expect(getByText('Guide utilisateur et assistance rapide')).toBeTruthy();
  });

  it('displays the guide section title', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    expect(getByText('Guide de prise en main')).toBeTruthy();
  });

  it('displays the support section title', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    expect(getByText('Support')).toBeTruthy();
  });

  it('navigates to support-new when new ticket button is pressed', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    fireEvent.press(getByText('Nouveau ticket'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/support-new');
  });

  it('navigates to support-tickets when my tickets button is pressed', () => {
    const { getByText } = render(<ProfileHelpScreen />);
    fireEvent.press(getByText('Mes tickets'));
    expect(mockPush).toHaveBeenCalledWith('/(stack)/support-tickets');
  });

  it('navigates back when back button is pressed', () => {
    const { UNSAFE_getAllByType } = render(<ProfileHelpScreen />);
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockBack).toHaveBeenCalled();
  });

  it('starts tour and navigates to dashboard when open guide is pressed', () => {
    const { getByTestId } = render(<ProfileHelpScreen />);
    fireEvent.press(getByTestId('open-onboarding-guide-button'));
    expect(mockStartTour).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/dashboard');
  });

  it('resets onboarding guide when reset button is pressed', async () => {
    const { getByTestId } = render(<ProfileHelpScreen />);
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    await waitFor(() => {
      expect(mockResetOnboarding).toHaveBeenCalled();
    });
  });

  it('shows success alert after reset', async () => {
    const { getByTestId } = render(<ProfileHelpScreen />);
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Guide reinitialise',
        expect.any(String)
      );
    });
  });

  it('shows error alert when reset fails', async () => {
    mockResetOnboarding.mockRejectedValueOnce(new Error('Storage error'));
    const { getByTestId } = render(<ProfileHelpScreen />);
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.any(String));
    });
  });

  it('does not call reset again when already resetting (button disabled)', async () => {
    let resolveReset: () => void;
    mockResetOnboarding.mockReturnValue(
      new Promise<void>((resolve) => { resolveReset = resolve; })
    );
    const { getByTestId } = render(<ProfileHelpScreen />);
    // First press starts the reset (button becomes disabled)
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    // Second press while disabled - fireEvent.press ignores disabled on TouchableOpacity
    // but the handleResetGuide guard (line 28) provides code-level protection
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    resolveReset!();
    await waitFor(() => {
      // Should only have been called once even if press fires twice
      expect(mockResetOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('renders ActivityIndicator during reset (shows loading state)', async () => {
    let resolveReset: () => void;
    mockResetOnboarding.mockReturnValue(
      new Promise<void>((resolve) => { resolveReset = resolve; })
    );
    const { getByTestId, UNSAFE_queryByType } = render(<ProfileHelpScreen />);
    fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    // After pressing, resettingGuide=true so ActivityIndicator should appear
    const { ActivityIndicator } = require('react-native');
    await waitFor(() => {
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
    resolveReset!();
  });

  it('guard: handleResetGuide returns early when resettingGuide is already true (line 28)', async () => {
    // The reset button is `disabled={resettingGuide}`, so fireEvent.press won't call onPress
    // when resettingGuide=true. Call the onPress prop directly to bypass the disabled guard.
    let resolveFirst: () => void;
    mockResetOnboarding.mockReturnValueOnce(
      new Promise<void>((resolve) => { resolveFirst = resolve; })
    );
    mockResetOnboarding.mockResolvedValue(undefined);

    const { getByTestId, UNSAFE_getAllByType } = render(<ProfileHelpScreen />);
    // First press — act() flushes setResettingGuide(true) so the component re-renders.
    await act(async () => {
      fireEvent.press(getByTestId('reset-onboarding-guide-button'));
    });
    // Now resettingGuide=true and the button is disabled. Find it and call onPress directly.
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const resetBtn = touchables.find(
      (t: any) => t.props.testID === 'reset-onboarding-guide-button'
    );
    await act(async () => {
      resetBtn?.props.onPress?.();
    });
    resolveFirst!();
    await waitFor(() => {
      // resetOnboarding must only be called once; the second invocation returned early (line 28)
      expect(mockResetOnboarding).toHaveBeenCalledTimes(1);
    });
  });
});
