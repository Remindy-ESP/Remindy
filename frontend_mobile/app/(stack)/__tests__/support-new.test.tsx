import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SupportNewScreen from '../support-new';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }),
}));

const mockGetCategories = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/services/api/support.service', () => ({
  supportService: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
    create: (...args: any[]) => mockCreate(...args),
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

describe('SupportNewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
    mockGetCategories.mockResolvedValue(['technical', 'billing', 'bug', 'other']);
    mockCreate.mockResolvedValue({ id: 'ticket-1', subject: 'Test' });
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
  });

  it('displays the header title', async () => {
    const { getByText } = render(<SupportNewScreen />);
    await waitFor(() => expect(getByText('Nouveau ticket')).toBeTruthy());
  });

  it('navigates back when back button is pressed', async () => {
    const { UNSAFE_getAllByType } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockBack).toHaveBeenCalled();
  });

  it('submit button is disabled when subject or message is empty', async () => {
    const { UNSAFE_getAllByType } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const submitBtn = touchables[touchables.length - 1];
    expect(submitBtn.props.disabled).toBe(true);
  });

  it('shows validation alert when submitting with empty fields', async () => {
    const { UNSAFE_getAllByType } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      touchables[touchables.length - 1].props.onPress?.();
    });
    expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls create and navigates on success', async () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Decrivez brievement votre probleme'), 'My subject');
    fireEvent.changeText(getByPlaceholderText('Decrivez votre probleme en detail...'), 'My message body');

    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      fireEvent.press(touchables[touchables.length - 1]);
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        subject: 'My subject',
        message: 'My message body',
        category: undefined,
      });
      expect(mockToast.success).toHaveBeenCalledWith(expect.any(String));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('shows error alert when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Server error'));
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText('Decrivez brievement votre probleme'), 'My subject');
    fireEvent.changeText(getByPlaceholderText('Decrivez votre probleme en detail...'), 'My message');

    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      fireEvent.press(touchables[touchables.length - 1]);
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('fetches categories on mount', async () => {
    render(<SupportNewScreen />);
    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalledTimes(1);
    });
  });

  it('gracefully handles category fetch failure', async () => {
    mockGetCategories.mockRejectedValueOnce(new Error('Network error'));
    const { toJSON } = render(<SupportNewScreen />);
    await waitFor(() => expect(mockGetCategories).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
  });
});
