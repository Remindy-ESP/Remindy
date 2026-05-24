import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SupportTicketDetailScreen from '../support-ticket-detail';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'ticket-1' }),
}));

const mockGetById = jest.fn();
const mockReply = jest.fn();

jest.mock('@/services/api/support.service', () => ({
  supportService: {
    getById: (...args: any[]) => mockGetById(...args),
    reply: (...args: any[]) => mockReply(...args),
  },
}));

jest.spyOn(Alert, 'alert');

const mockTicket = {
  id: 'ticket-1',
  subject: 'My billing issue',
  status: 'open' as const,
  category: 'billing' as const,
  priority: 'medium',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastReplyAt: null,
  messages: [
    {
      id: 'msg-1',
      authorType: 'user' as const,
      body: 'Hello, I need help with my bill',
      createdAt: '2026-01-01T00:01:00.000Z',
      author: { id: 'user-1', email: 'user@test.com', firstName: 'John', lastName: 'Doe' },
    },
    {
      id: 'msg-2',
      authorType: 'admin' as const,
      body: 'We are looking into it',
      createdAt: '2026-01-01T00:02:00.000Z',
      author: { id: 'admin-1', email: 'admin@test.com', firstName: 'Support', lastName: 'Team' },
    },
  ],
};

const mockClosedTicket = { ...mockTicket, status: 'closed' as const };

describe('SupportTicketDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetById.mockResolvedValue(mockTicket);
    mockReply.mockResolvedValue(undefined);
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
  });

  it('displays the ticket subject', async () => {
    const { getByText } = render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(getByText('My billing issue')).toBeTruthy();
    });
  });

  it('fetches the ticket by id on mount', async () => {
    render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(mockGetById).toHaveBeenCalledWith('ticket-1');
    });
  });

  it('displays all messages in the thread', async () => {
    const { getByText } = render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(getByText('Hello, I need help with my bill')).toBeTruthy();
      expect(getByText('We are looking into it')).toBeTruthy();
    });
  });

  it('shows reply input when ticket is open', async () => {
    const { getByPlaceholderText } = render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(getByPlaceholderText('Votre message...')).toBeTruthy();
    });
  });

  it('shows closed message when ticket is closed', async () => {
    mockGetById.mockResolvedValueOnce(mockClosedTicket);
    const { getByText } = render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(getByText('Ce ticket est ferme')).toBeTruthy();
    });
  });

  it('does not show reply input when ticket is closed', async () => {
    mockGetById.mockResolvedValueOnce(mockClosedTicket);
    const { queryByPlaceholderText } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    expect(queryByPlaceholderText('Votre message...')).toBeNull();
  });

  it('send button is disabled when reply input is empty', async () => {
    const { UNSAFE_getAllByType } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const sendBtn = touchables[touchables.length - 1];
    expect(sendBtn.props.disabled).toBe(true);
  });

  it('sends reply and reloads ticket on success', async () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(getByPlaceholderText('Votre message...')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Votre message...'), 'Thank you!');

    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      fireEvent.press(touchables[touchables.length - 1]);
    });

    await waitFor(() => {
      expect(mockReply).toHaveBeenCalledWith('ticket-1', 'Thank you!');
      expect(mockGetById).toHaveBeenCalledTimes(2);
    });
  });

  it('clears reply input after successful send', async () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(getByPlaceholderText('Votre message...')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Votre message...'), 'My reply');
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      fireEvent.press(touchables[touchables.length - 1]);
    });

    await waitFor(() => {
      expect(getByPlaceholderText('Votre message...')).toBeTruthy();
    });
  });

  it('shows error alert when reply fails', async () => {
    mockReply.mockRejectedValueOnce(new Error('Server error'));
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(getByPlaceholderText('Votre message...')).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText('Votre message...'), 'My reply');
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    await act(async () => {
      fireEvent.press(touchables[touchables.length - 1]);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.any(String));
    });
  });

  it('shows error alert when initial load fails', async () => {
    mockGetById.mockRejectedValueOnce(new Error('Not found'));
    render(<SupportTicketDetailScreen />);
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', expect.any(String));
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { UNSAFE_getAllByType } = render(<SupportTicketDetailScreen />);
    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockBack).toHaveBeenCalled();
  });
});
