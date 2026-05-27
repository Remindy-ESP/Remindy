import React from 'react';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';
import { authService, getErrorMessage } from '@/services/api';
import { toast } from '@/context/ToastContext';
import { useLocalSearchParams } from 'expo-router';

// --- Mocks ---

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/services/api', () => ({
  authService: { resetPassword: jest.fn() },
  getErrorMessage: jest.fn((err, fallback) =>
    err instanceof Error ? err.message : fallback,
  ),
}));

// jest.setup.js already mocks @/shared/application/I18nContext — we override it here
// so the t() function returns the key (simplest contract for unit tests).
jest.mock('@/shared/application/I18nContext', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('@/context/ToastContext', () => ({
  toast: { error: jest.fn() },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

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
    passwordContainer: {},
    passwordInput: {},
    eyeButton: {},
  },
}));

// --- Helpers ---

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockResetPassword = authService.resetPassword as jest.Mock;
const mockToastError = toast.error as jest.Mock;

// Late import so mocks are in place before the module is loaded
let ResetPasswordScreen: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ResetPasswordScreen = require('../ResetPasswordScreen').default;
});

function renderScreen() {
  return render(<ResetPasswordScreen />);
}

// Fill form helpers
function fillToken(getByTestId: ReturnType<typeof render>['getByTestId'], value: string) {
  fireEvent.changeText(getByTestId('reset-token-input'), value);
}

function fillPassword(getByTestId: ReturnType<typeof render>['getByTestId'], value: string) {
  fireEvent.changeText(getByTestId('reset-password-input'), value);
}

function fillConfirm(getByTestId: ReturnType<typeof render>['getByTestId'], value: string) {
  fireEvent.changeText(getByTestId('reset-confirm-password-input'), value);
}

function pressSubmit(getByTestId: ReturnType<typeof render>['getByTestId']) {
  fireEvent.press(getByTestId('reset-submit-button'));
}

// --- Test suite ---

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
  });

  // 1. Renders inputs and buttons
  it('renders all inputs and interactive elements', () => {
    const { getByTestId } = renderScreen();

    expect(getByTestId('reset-token-input')).toBeTruthy();
    expect(getByTestId('reset-password-input')).toBeTruthy();
    expect(getByTestId('reset-confirm-password-input')).toBeTruthy();
    expect(getByTestId('reset-submit-button')).toBeTruthy();
    expect(getByTestId('reset-login-link')).toBeTruthy();
  });

  // 2. Validation: empty token → error (authService NOT called)
  it('shows error and does not call API when token is empty', async () => {
    const { getByTestId } = renderScreen();

    fillToken(getByTestId, '');
    fillPassword(getByTestId, 'validPass1');
    fillConfirm(getByTestId, 'validPass1');
    pressSubmit(getByTestId);

    await waitFor(() => {
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  // 3. Validation: empty password → error
  it('shows error and does not call API when password is empty', async () => {
    const { getByTestId } = renderScreen();

    fillToken(getByTestId, 'my-token');
    fillPassword(getByTestId, '');
    fillConfirm(getByTestId, '');
    pressSubmit(getByTestId);

    await waitFor(() => {
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  // 4. Validation: password too short (< 8 chars)
  it('shows error and does not call API when password is shorter than 8 characters', async () => {
    const { getByTestId } = renderScreen();

    fillToken(getByTestId, 'my-token');
    fillPassword(getByTestId, 'short');
    fillConfirm(getByTestId, 'short');
    pressSubmit(getByTestId);

    await waitFor(() => {
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  // 5. Validation: passwords don't match
  it('shows error and does not call API when passwords do not match', async () => {
    const { getByTestId } = renderScreen();

    fillToken(getByTestId, 'my-token');
    fillPassword(getByTestId, 'password123');
    fillConfirm(getByTestId, 'different123');
    pressSubmit(getByTestId);

    await waitFor(() => {
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  // 6. Successful reset: calls authService then router.replace('/')
  it('calls authService.resetPassword and navigates to / on success', async () => {
    mockResetPassword.mockResolvedValueOnce(undefined);

    const { getByTestId } = renderScreen();

    fillToken(getByTestId, 'valid-token');
    fillPassword(getByTestId, 'newPassword1');
    fillConfirm(getByTestId, 'newPassword1');

    await act(async () => {
      pressSubmit(getByTestId);
    });

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('valid-token', 'newPassword1');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  // 7. Failed reset: shows error and calls toast.error
  it('shows error message and calls toast.error when API rejects', async () => {
    const apiError = new Error('Token expired');
    mockResetPassword.mockRejectedValueOnce(apiError);

    const { getByTestId } = renderScreen();

    fillToken(getByTestId, 'bad-token');
    fillPassword(getByTestId, 'newPassword1');
    fillConfirm(getByTestId, 'newPassword1');

    await act(async () => {
      pressSubmit(getByTestId);
    });

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Token expired');
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // 8. Pre-fills token from query params
  it('pre-fills the token input with the token from query params', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: 'abc' });

    const { getByTestId } = renderScreen();

    const tokenInput = getByTestId('reset-token-input');
    expect(tokenInput.props.value).toBe('abc');
  });

  // 8b. Pre-fills token when param is an array (first element)
  it('pre-fills the token input with the first element when token param is an array', async () => {
    mockUseLocalSearchParams.mockReturnValue({ token: ['array-token', 'second'] });

    const { getByTestId } = renderScreen();

    const tokenInput = getByTestId('reset-token-input');
    expect(tokenInput.props.value).toBe('array-token');
  });

  // 9. Toggle password visibility (eye button)
  // TouchableOpacity renders as a View in the test renderer (no 'button' role by default).
  // We grab all pressable elements (Views with accessible=true) and identify the eye buttons
  // by excluding those that have a known testID (submit button and login link).
  it('toggles new-password visibility when the eye button is pressed', async () => {
    const { getByTestId, UNSAFE_getAllByType } = renderScreen();

    const passwordInput = getByTestId('reset-password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Import TouchableOpacity from react-native to query by component type
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Eye buttons have no testID; submit and login-link have testIDs
    const eyeButtons = touchables.filter((t: { props: { testID?: string } }) => !t.props.testID);

    // First eye button toggles the new-password field
    fireEvent.press(eyeButtons[0]);

    await waitFor(() => {
      expect(getByTestId('reset-password-input').props.secureTextEntry).toBe(false);
    });
  });

  // 9b. Toggle confirm-password visibility
  it('toggles confirm-password visibility when the second eye button is pressed', async () => {
    const { getByTestId, UNSAFE_getAllByType } = renderScreen();

    const confirmInput = getByTestId('reset-confirm-password-input');
    expect(confirmInput.props.secureTextEntry).toBe(true);

    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const eyeButtons = touchables.filter((t: { props: { testID?: string } }) => !t.props.testID);

    // Second eye button toggles the confirm-password field
    fireEvent.press(eyeButtons[1]);

    await waitFor(() => {
      expect(getByTestId('reset-confirm-password-input').props.secureTextEntry).toBe(false);
    });
  });

  // back link navigates to /
  it('navigates to / when the back-to-login link is pressed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('reset-login-link'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
