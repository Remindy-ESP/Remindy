import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AuthScreen from '../index';

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

const mockLogin = jest.fn();
const mockRegister = jest.fn();

// Use a mutable object so the mock factory closure always reads the latest value
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
  }),
}));

const mockHasSeenOnboarding = jest.fn(() => Promise.resolve(true));
jest.mock('@/services/local/onboarding.service', () => ({
  __esModule: true,
  default: {
    hasSeenOnboarding: (...args: any[]) => mockHasSeenOnboarding(...args),
    setHasSeenOnboarding: jest.fn(() => Promise.resolve()),
    resetOnboarding: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/services/api', () => ({
  getErrorMessage: (error: any, fallback: string) => error?.message || fallback,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

jest.spyOn(Alert, 'alert');

describe('AuthScreen', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogin.mockClear();
    mockRegister.mockClear();
    (Alert.alert as jest.Mock).mockClear();
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
    mockHasSeenOnboarding.mockResolvedValue(true);
  });

  it('renders login mode by default', async () => {
    const { getByText } = render(<AuthScreen />);
    await waitFor(() => {
      expect(getByText('Bienvenue')).toBeTruthy();
      expect(getByText('Se connecter')).toBeTruthy();
      expect(getByText('Mot de passe oublie ?')).toBeTruthy();
    });
  });

  it('renders email and password inputs', async () => {
    const { getByTestId } = render(<AuthScreen />);
    await waitFor(() => {
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
    });
  });

  it('toggles between login and register modes', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<AuthScreen />);

    // Initially in login mode
    await waitFor(() => {
      expect(getByText('Bienvenue')).toBeTruthy();
      expect(queryByTestId('confirm-password-input')).toBeNull();
    });

    // Toggle to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByText('Créer un compte')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
    expect(getByTestId('firstName-input')).toBeTruthy();
    expect(getByTestId('lastName-input')).toBeTruthy();

    // Toggle back to login mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByText('Bienvenue')).toBeTruthy();
    expect(queryByTestId('confirm-password-input')).toBeNull();
  });

  it('updates email input value', async () => {
    const { getByTestId } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('updates password input value', async () => {
    const { getByTestId } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('password-input')).toBeTruthy());
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('shows confirm password input only in register mode', async () => {
    const { getByTestId, queryByTestId } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());

    // Login mode - no confirm password
    expect(queryByTestId('confirm-password-input')).toBeNull();

    // Switch to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('navigates to forgot password screen from login mode', async () => {
    const { getByTestId } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('forgot-password-link')).toBeTruthy());
    fireEvent.press(getByTestId('forgot-password-link'));
    expect(mockPush).toHaveBeenCalledWith('/forgot-password');
  });

  it('handles form submission for registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByTestId } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());

    // Switch to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));

    // Fill inputs
    fireEvent.changeText(getByTestId('firstName-input'), 'John');
    fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

    const submitButton = getByTestId('submit-button');

    expect(submitButton).toBeTruthy();
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'john@example.com',
        'password123',
        'John',
        'Doe',
      );
    });
  });

  // ── Loading / auth-check state ──────────────────────────────────────────────

  it('shows loading spinner while authLoading is true', async () => {
    mockAuthState.isLoading = true;
    const { getByText } = render(<AuthScreen />);
    // onboardingCheckDone starts false, so spinner shows regardless
    await waitFor(() => expect(getByText('Loading...')).toBeTruthy());
  });

  it('shows loading spinner while onboarding check is pending', async () => {
    // never resolves → onboardingCheckDone stays false
    mockHasSeenOnboarding.mockReturnValue(new Promise(() => {}));
    const { getByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByText('Loading...')).toBeTruthy());
  });

  // ── Onboarding redirect ─────────────────────────────────────────────────────

  it('redirects to /onboarding when onboarding not seen', async () => {
    mockHasSeenOnboarding.mockResolvedValue(false);
    render(<AuthScreen />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  // ── Authenticated redirect ──────────────────────────────────────────────────

  it('redirects to dashboard when already authenticated and onboarding done', async () => {
    mockAuthState.isAuthenticated = true;
    mockHasSeenOnboarding.mockResolvedValue(true);
    render(<AuthScreen />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/dashboard');
    });
  });

  // ── Form validation errors ──────────────────────────────────────────────────

  it('shows error when email is empty', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('submit-button')).toBeTruthy());
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Email is required')).toBeTruthy();
  });

  it('shows error when email is invalid', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Please enter a valid email address')).toBeTruthy();
  });

  it('shows error when password is empty', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Password is required')).toBeTruthy();
  });

  it('shows error when password is too short', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'abc');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('shows error when firstName is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('First name is required')).toBeTruthy();
  });

  it('shows error when lastName is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('firstName-input'), 'John');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Last name is required')).toBeTruthy();
  });

  it('shows error when confirmPassword is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('firstName-input'), 'John');
    fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Please confirm your password')).toBeTruthy();
  });

  it('shows error when passwords do not match in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('firstName-input'), 'John');
    fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'different');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Passwords do not match')).toBeTruthy();
  });

  // ── Login success ───────────────────────────────────────────────────────────

  it('calls login with email and password on valid login form', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByTestId } = render(<AuthScreen />);
    // Wait for the form to appear (onboarding check resolves)
    await waitFor(() => expect(getByTestId('submit-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  // ── Login error ─────────────────────────────────────────────────────────────

  it('shows alert and error message when login fails', async () => {
    mockLogin.mockRejectedValue({ message: 'Invalid credentials' });
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Invalid credentials')).toBeTruthy();
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  // ── Register error ──────────────────────────────────────────────────────────

  it('shows alert and error message when registration fails', async () => {
    mockRegister.mockRejectedValue({ message: 'Email already taken' });
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('firstName-input'), 'John');
    fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Email already taken')).toBeTruthy();
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Email already taken');
    });
  });

  // ── Toggle clears error ─────────────────────────────────────────────────────

  it('clears error message when toggling auth mode', async () => {
    const { getByTestId, queryByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('submit-button')).toBeTruthy());
    // trigger a validation error
    fireEvent.press(getByTestId('submit-button'));
    await waitFor(() => expect(queryByText('Email is required')).toBeTruthy());
    // toggle clears it
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(queryByText('Email is required')).toBeNull();
  });
});
