import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AuthScreen from '../index';

const mockReplace = global.__mockRouterReplace as jest.Mock;
const mockPush = global.__mockRouterPush as jest.Mock;

const mockLogin = jest.fn();
const mockRegister = jest.fn();

// Use a mutable object so the mock factory closure always reads the latest value
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

// Mock AuthContext
jest.mock('@/modules/auth/application/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isAuthenticated: mockAuthState.isAuthenticated,
    isLoading: mockAuthState.isLoading,
  }),
}));

const mockHasSeenOnboarding = global.__mockOnboardingHasSeen as jest.Mock;

jest.mock('@/services/api', () => ({
  getErrorMessage: (error: any, fallback: string) => error?.message || fallback,
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastInfo = jest.fn();
jest.mock('@/context/ToastContext', () => ({
  toast: Object.assign(
    jest.fn(),
    { error: (...args: any[]) => mockToastError(...args), success: (...args: any[]) => mockToastSuccess(...args), info: (...args: any[]) => mockToastInfo(...args) }
  ),
  ToastProvider: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Helper to fill the register form (used by many tests)
const fillRegisterForm = (
  getByTestId: (id: string) => any,
  { confirmPassword = 'password123', skip = [] as string[] } = {},
) => {
  fireEvent.press(getByTestId('toggle-auth-mode'));
  if (!skip.includes('email')) fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
  if (!skip.includes('password')) fireEvent.changeText(getByTestId('password-input'), 'password123');
  if (!skip.includes('firstName')) fireEvent.changeText(getByTestId('firstName-input'), 'John');
  if (!skip.includes('lastName')) fireEvent.changeText(getByTestId('lastName-input'), 'Doe');
  if (!skip.includes('confirmPassword'))
    fireEvent.changeText(getByTestId('confirm-password-input'), confirmPassword);
};

describe('AuthScreen', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogin.mockClear();
    mockRegister.mockClear();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockToastInfo.mockClear();
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

    fillRegisterForm(getByTestId, { skip: ['email'] });
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.press(getByTestId('submit-button'));

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
    await waitFor(() => expect(getByText('Chargement…')).toBeTruthy());
  });

  // ── Onboarding redirect ─────────────────────────────────────────────────────

  it('redirects to /onboarding after login when onboarding not yet seen', async () => {
    mockAuthState.isAuthenticated = true;
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
    expect(await findByText("L'email est requis")).toBeTruthy();
  });

  it('shows error when email is invalid', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Veuillez saisir une adresse email valide')).toBeTruthy();
  });

  it('shows error when password is empty', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Le mot de passe est requis')).toBeTruthy();
  });

  it('shows error when password is too short', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'abc');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Le mot de passe doit contenir au moins 6 caractères')).toBeTruthy();
  });

  it('shows error when firstName is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fireEvent.press(getByTestId('toggle-auth-mode'));
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Le prénom est requis')).toBeTruthy();
  });

  it('shows error when lastName is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fillRegisterForm(getByTestId, { skip: ['lastName', 'confirmPassword'] });
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Le nom est requis')).toBeTruthy();
  });

  it('shows error when confirmPassword is empty in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fillRegisterForm(getByTestId, { skip: ['confirmPassword'] });
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Veuillez confirmer votre mot de passe')).toBeTruthy();
  });

  it('shows error when passwords do not match in register mode', async () => {
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fillRegisterForm(getByTestId, { confirmPassword: 'different' });
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Les mots de passe ne correspondent pas')).toBeTruthy();
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

  it('shows toast error and error message when login fails', async () => {
    mockLogin.mockRejectedValue({ message: 'Invalid credentials' });
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('email-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Invalid credentials')).toBeTruthy();
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  // ── Register error ──────────────────────────────────────────────────────────

  it('shows toast error and error message when registration fails', async () => {
    mockRegister.mockRejectedValue({ message: 'Email already taken' });
    const { getByTestId, findByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('toggle-auth-mode')).toBeTruthy());
    fillRegisterForm(getByTestId);
    fireEvent.press(getByTestId('submit-button'));
    expect(await findByText('Email already taken')).toBeTruthy();
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Email already taken');
    });
  });

  // ── Toggle clears error ─────────────────────────────────────────────────────

  it('clears error message when toggling auth mode', async () => {
    const { getByTestId, queryByText } = render(<AuthScreen />);
    await waitFor(() => expect(getByTestId('submit-button')).toBeTruthy());
    // trigger a validation error
    fireEvent.press(getByTestId('submit-button'));
    await waitFor(() => expect(queryByText("L'email est requis")).toBeTruthy());
    // toggle clears it
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(queryByText("L'email est requis")).toBeNull();
  });
});
