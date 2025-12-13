import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AuthScreen from '../index';

// Mock expo-router
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('AuthScreen', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });
  it('renders login mode by default', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('Bienvenue')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('renders email and password inputs', () => {
    const { getByTestId } = render(<AuthScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('toggles between login and register modes', () => {
    const { getByTestId, getByText, queryByTestId } = render(<AuthScreen />);

    // Initially in login mode
    expect(getByText('Bienvenue')).toBeTruthy();
    expect(queryByTestId('confirm-password-input')).toBeNull();

    // Toggle to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByText('Créer un compte')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
    expect(getByTestId('firstname-input')).toBeTruthy();
    expect(getByTestId('lastname-input')).toBeTruthy();

    // Toggle back to login mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByText('Bienvenue')).toBeTruthy();
    expect(queryByTestId('confirm-password-input')).toBeNull();
  });

  it('updates email input value', () => {
    const { getByTestId } = render(<AuthScreen />);
    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('updates password input value', () => {
    const { getByTestId } = render(<AuthScreen />);
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('shows confirm password input only in register mode', () => {
    const { getByTestId, queryByTestId } = render(<AuthScreen />);

    // Login mode - no confirm password
    expect(queryByTestId('confirm-password-input')).toBeNull();

    // Switch to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));
    expect(getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('calls submit button handler with api call for registration', async () => {
    const { getByTestId } = render(<AuthScreen />);

    // Switch to register mode
    fireEvent.press(getByTestId('toggle-auth-mode'));

    // Fill inputs
    fireEvent.changeText(getByTestId('firstname-input'), 'John');
    fireEvent.changeText(getByTestId('lastname-input'), 'Doe');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }),
    });
  });
});
