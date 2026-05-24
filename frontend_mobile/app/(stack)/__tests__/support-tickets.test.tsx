import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SupportTicketsScreen from '../support-tickets';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
  useFocusEffect: (cb: () => void) => { require('react').useEffect(cb, []); },
}));

const mockListMine = jest.fn();

jest.mock('@/services/api/support.service', () => ({
  supportService: {
    listMine: (...args: any[]) => mockListMine(...args),
  },
}));

const mockTicket = {
  id: 'ticket-1',
  subject: 'My billing issue',
  status: 'open' as const,
  category: 'billing' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastReplyAt: null,
};

describe('SupportTicketsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListMine.mockResolvedValue({ items: [mockTicket], total: 1, page: 1, limit: 50 });
  });

  it('renders without crashing', async () => {
    const { toJSON } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(mockListMine).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
  });

  it('displays the screen title', async () => {
    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(getByText('Mes tickets')).toBeTruthy());
  });

  it('loads and displays tickets', async () => {
    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => {
      expect(getByText('My billing issue')).toBeTruthy();
    });
  });

  it('calls listMine with limit 50 on mount', async () => {
    render(<SupportTicketsScreen />);
    await waitFor(() => {
      expect(mockListMine).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  it('shows empty state when there are no tickets', async () => {
    mockListMine.mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 50 });
    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => {
      expect(getByText(/Aucun ticket/i)).toBeTruthy();
    });
  });

  it('shows error state when fetch fails', async () => {
    mockListMine.mockRejectedValueOnce(new Error('Network error'));
    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => {
      expect(getByText('Impossible de charger vos tickets.')).toBeTruthy();
    });
  });

  it('retries fetch when retry button is pressed', async () => {
    mockListMine.mockRejectedValueOnce(new Error('Network error'));
    mockListMine.mockResolvedValueOnce({ items: [mockTicket], total: 1, page: 1, limit: 50 });

    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(getByText('Reessayer')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Reessayer'));
    });

    await waitFor(() => {
      expect(mockListMine).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to new ticket screen when add button is pressed', async () => {
    const { UNSAFE_getAllByType } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(mockListMine).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[1]);
    expect(mockPush).toHaveBeenCalledWith('/(stack)/support-new');
  });

  it('navigates back when back button is pressed', async () => {
    const { UNSAFE_getAllByType } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(mockListMine).toHaveBeenCalled());
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(mockBack).toHaveBeenCalled();
  });

  it('navigates to ticket detail when a ticket row is pressed', async () => {
    const { getByText } = render(<SupportTicketsScreen />);
    await waitFor(() => expect(getByText('My billing issue')).toBeTruthy());

    fireEvent.press(getByText('My billing issue'));

    expect(mockPush).toHaveBeenCalledWith('/(stack)/support-ticket-detail?id=ticket-1');
  });
});
