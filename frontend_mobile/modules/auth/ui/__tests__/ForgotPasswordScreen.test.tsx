import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any component import
// ---------------------------------------------------------------------------

jest.mock('@/services/api', () => ({
  authService: { forgotPassword: jest.fn() },
  getErrorMessage: jest.fn((err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback,
  ),
}));

// expo-router is already mocked in jest.setup.js, but we override here to get
// a local reference to the back() spy so we can assert on it per-test.
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: jest.fn() })),
}));

// I18nContext is already mocked globally but we keep this consistent.
jest.mock('@/shared/application/I18nContext', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('@/context/ToastContext', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

jest.mock('@/shared/ui/FormFeedback', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/shared/styles/authForm', () => ({
  authFormStyles: {
    container: {},
    content: {},
    input: {},
    button: {},
    buttonDisabled: {},
    buttonText: {},
    linkText: {},
  },
}));

// ---------------------------------------------------------------------------
// Typed references to mocked modules — imported AFTER jest.mock declarations
// ---------------------------------------------------------------------------

import { authService, getErrorMessage } from '@/services/api';
import { useRouter } from 'expo-router';
import { toast } from '@/context/ToastContext';

const mockForgotPassword = authService.forgotPassword as jest.Mock;
const mockGetErrorMessage = getErrorMessage as jest.Mock;
const mockToastError = toast.error as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import ForgotPasswordScreen from '../ForgotPasswordScreen';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderScreen() {
  return render(<ForgotPasswordScreen />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: forgotPassword resolves successfully
    mockForgotPassword.mockResolvedValue(undefined);
    // Restore default getErrorMessage behaviour
    mockGetErrorMessage.mockImplementation((err: unknown, fallback: string) =>
      err instanceof Error ? err.message : fallback,
    );
    // Provide a fresh back() spy for each test
    mockUseRouter.mockReturnValue({ back: jest.fn() });
  });

  // -------------------------------------------------------------------------
  // 1. Renders submit and back buttons
  // -------------------------------------------------------------------------
  it('renders the submit button and the back button', () => {
    const { getByTestId } = renderScreen();

    expect(getByTestId('forgot-submit-button')).toBeTruthy();
    expect(getByTestId('forgot-back-button')).toBeTruthy();
  });

  it('renders the email input', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('forgot-email-input')).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // 2. Validation error when email is empty
  // -------------------------------------------------------------------------
  it('does not call authService.forgotPassword when email is empty', async () => {
    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('does not call authService.forgotPassword when email is whitespace only', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), '   ');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 3. Email with non-empty value (even if invalid format) bypasses the empty
  //    check and reaches forgotPassword (component only validates emptiness)
  // -------------------------------------------------------------------------
  it('calls authService.forgotPassword even with a non-email string (no format check)', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'not-an-email');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    // The component trims and passes the value directly — no format validation
    expect(mockForgotPassword).toHaveBeenCalledWith('not-an-email');
  });

  // -------------------------------------------------------------------------
  // 4. Calls authService.forgotPassword with trimmed email on valid submit
  // -------------------------------------------------------------------------
  it('calls authService.forgotPassword with the trimmed email', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), '  user@example.com  ');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com');
    });
  });

  it('calls authService.forgotPassword exactly once', async () => {
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Shows success after forgotPassword resolves
  // -------------------------------------------------------------------------
  it('does not call toast.error on successful submission', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalled();
    });

    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('does not show an error on successful submission', async () => {
    mockForgotPassword.mockResolvedValue(undefined);
    const { getByTestId, queryByText } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalled();
    });

    // FormFeedback is mocked to null, so we verify toast.error was not called
    expect(mockToastError).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 6. Shows error and calls toast.error when forgotPassword rejects
  // -------------------------------------------------------------------------
  it('calls toast.error when authService.forgotPassword rejects', async () => {
    const error = new Error('Server error');
    mockForgotPassword.mockRejectedValue(error);
    mockGetErrorMessage.mockReturnValue('Server error');

    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Server error');
    });
  });

  it('calls getErrorMessage with the caught error on failure', async () => {
    const error = new Error('API error');
    mockForgotPassword.mockRejectedValue(error);

    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    await waitFor(() => {
      expect(mockGetErrorMessage).toHaveBeenCalledWith(error, expect.any(String));
    });
  });

  // -------------------------------------------------------------------------
  // 7. Calls router.back when back button pressed
  // -------------------------------------------------------------------------
  it('calls router.back() when the back button is pressed', async () => {
    const mockBack = jest.fn();
    mockUseRouter.mockReturnValue({ back: mockBack });

    const { getByTestId } = renderScreen();

    await act(async () => {
      fireEvent.press(getByTestId('forgot-back-button'));
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // 8. Shows ActivityIndicator while loading
  // -------------------------------------------------------------------------
  it('shows ActivityIndicator while the request is pending', async () => {
    // Keep the promise pending so the loading state stays true
    mockForgotPassword.mockReturnValue(new Promise(() => {}));

    const { getByTestId, UNSAFE_getByType } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    // The submit button renders <ActivityIndicator> instead of the text when loading
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('disables the submit button while loading (shows ActivityIndicator instead of text)', async () => {
    mockForgotPassword.mockReturnValue(new Promise(() => {}));

    const { getByTestId, UNSAFE_getByType, queryByText } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    // When loading, the button renders ActivityIndicator instead of its text label
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    // The submit text label is gone
    expect(queryByText('auth.forgot.submit')).toBeNull();
  });

  it('re-enables the submit button (shows text) after the request completes', async () => {
    mockForgotPassword.mockResolvedValue(undefined);

    const { getByTestId, findByText } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-email-input'), 'user@example.com');

    await act(async () => {
      fireEvent.press(getByTestId('forgot-submit-button'));
    });

    // After completion the loading state goes false and the label is visible again
    await findByText('auth.forgot.submit');
  });
});
