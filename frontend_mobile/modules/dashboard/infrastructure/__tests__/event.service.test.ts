import { eventService } from '@/modules/dashboard/infrastructure/eventApi';
import apiClient from '@/shared/infrastructure/apiClient';
import { Event, Subscription } from '../types';

// Mock the API client
jest.mock('@/shared/infrastructure/apiClient');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubscription: Subscription = {
    id: 'sub1',
    userId: 'user1',
    name: 'Netflix',
    amount: 15.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: '2024-01-01T00:00:00.000Z',
    nextDueDate: '2024-02-01T00:00:00.000Z',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockEvent: Event = {
    id: 'event1',
    title: 'Netflix - February payment',
    description: 'Monthly subscription payment',
    dueDate: '2024-02-01T00:00:00.000Z',
    status: 'scheduled',
    subscriptionId: 'sub1',
    subscription: mockSubscription,
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockEvents: Event[] = [
    mockEvent,
    {
      id: 'event2',
      title: 'Spotify - February payment',
      dueDate: '2024-02-05T00:00:00.000Z',
      status: 'scheduled',
      subscriptionId: 'sub2',
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'event3',
      title: 'Amazon Prime - February payment',
      dueDate: '2024-02-10T00:00:00.000Z',
      status: 'completed',
      subscriptionId: 'sub3',
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('getAll', () => {
    it('fetches all events with default limit of 1000', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvents });

      const result = await eventService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/calendar/events', {
        params: { limit: 1000 },
      });
      expect(result).toEqual(mockEvents);
      expect(result).toHaveLength(3);
    });

    it('returns events with correct structure', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvents });

      const result = await eventService.getAll();

      result.forEach(event => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('dueDate');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('subscriptionId');
        expect(event).toHaveProperty('userId');
      });
    });

    it('returns events with subscription data when populated', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockEvent] });

      const result = await eventService.getAll();

      expect(result[0].subscription).toEqual(mockSubscription);
    });

    it('returns empty array when no events', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await eventService.getAll();

      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getAll()).rejects.toThrow('Network error');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getAll()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getByDateRange', () => {
    it('fetches events within a date range', async () => {
      const filteredEvents = [mockEvent];
      mockApiClient.get.mockResolvedValue({ data: filteredEvents });

      const result = await eventService.getByDateRange(
        '2024-02-01T00:00:00.000Z',
        '2024-02-28T23:59:59.000Z'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith('/calendar/events', {
        params: {
          startDate: '2024-02-01T00:00:00.000Z',
          endDate: '2024-02-28T23:59:59.000Z',
        },
      });
      expect(result).toEqual(filteredEvents);
    });

    it('returns multiple events in date range', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvents });

      const result = await eventService.getByDateRange(
        '2024-02-01T00:00:00.000Z',
        '2024-02-28T23:59:59.000Z'
      );

      expect(result).toHaveLength(3);
    });

    it('returns empty array when no events in range', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await eventService.getByDateRange(
        '2020-01-01T00:00:00.000Z',
        '2020-01-31T23:59:59.000Z'
      );

      expect(result).toEqual([]);
    });

    it('throws on invalid date format', async () => {
      const error = new Error('Invalid date format');
      mockApiClient.get.mockRejectedValue(error);

      await expect(
        eventService.getByDateRange('invalid-date', '2024-02-28')
      ).rejects.toThrow('Invalid date format');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(
        eventService.getByDateRange('2024-02-01', '2024-02-28')
      ).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('fetches a specific event by ID', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      const result = await eventService.getById('event1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/calendar/events/event1');
      expect(result).toEqual(mockEvent);
    });

    it('returns event with all fields', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      const result = await eventService.getById('event1');

      expect(result.id).toBe('event1');
      expect(result.title).toBe('Netflix - February payment');
      expect(result.dueDate).toBe('2024-02-01T00:00:00.000Z');
      expect(result.status).toBe('scheduled');
      expect(result.subscriptionId).toBe('sub1');
    });

    it('throws on event not found', async () => {
      const error = new Error('Event not found');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getById('invalid-id')).rejects.toThrow('Event not found');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getById('event1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateStatus', () => {
    it('marks an event as completed', async () => {
      const completedEvent: Event = { ...mockEvent, status: 'completed' };
      mockApiClient.patch.mockResolvedValue({ data: completedEvent });

      const result = await eventService.updateStatus('event1', 'completed');

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/calendar/events/event1/status',
        { status: 'completed' }
      );
      expect(result.status).toBe('completed');
    });

    it('marks an event as canceled', async () => {
      const canceledEvent: Event = { ...mockEvent, status: 'canceled' };
      mockApiClient.patch.mockResolvedValue({ data: canceledEvent });

      const result = await eventService.updateStatus('event1', 'canceled');

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/calendar/events/event1/status',
        { status: 'canceled' }
      );
      expect(result.status).toBe('canceled');
    });

    it('marks an event as failed', async () => {
      const failedEvent: Event = { ...mockEvent, status: 'failed' };
      mockApiClient.patch.mockResolvedValue({ data: failedEvent });

      const result = await eventService.updateStatus('event1', 'failed');

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/calendar/events/event1/status',
        { status: 'failed' }
      );
      expect(result.status).toBe('failed');
    });

    it('marks an event as scheduled', async () => {
      const scheduledEvent: Event = { ...mockEvent, status: 'scheduled' };
      mockApiClient.patch.mockResolvedValue({ data: scheduledEvent });

      const result = await eventService.updateStatus('event1', 'scheduled');

      expect(result.status).toBe('scheduled');
    });

    it('throws on event not found', async () => {
      const error = new Error('Event not found');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.updateStatus('invalid-id', 'completed')
      ).rejects.toThrow('Event not found');
    });

    it('throws on invalid status transition', async () => {
      const error = new Error('Invalid status transition');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.updateStatus('event1', 'completed')
      ).rejects.toThrow('Invalid status transition');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.updateStatus('event1', 'canceled')
      ).rejects.toThrow('Network error');
    });
  });

  describe('reschedule', () => {
    it('reschedules an event to a new date', async () => {
      const newDate = '2024-03-01T00:00:00.000Z';
      const rescheduledEvent: Event = { ...mockEvent, dueDate: newDate };
      mockApiClient.patch.mockResolvedValue({ data: rescheduledEvent });

      const result = await eventService.reschedule('event1', newDate);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/calendar/events/event1/reschedule',
        { newDate }
      );
      expect(result.dueDate).toBe(newDate);
    });

    it('returns rescheduled event with updated due date', async () => {
      const newDate = '2024-04-15T12:00:00.000Z';
      const rescheduledEvent: Event = { ...mockEvent, dueDate: newDate };
      mockApiClient.patch.mockResolvedValue({ data: rescheduledEvent });

      const result = await eventService.reschedule('event1', newDate);

      expect(result.id).toBe('event1');
      expect(result.dueDate).toBe(newDate);
    });

    it('throws on event not found', async () => {
      const error = new Error('Event not found');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.reschedule('invalid-id', '2024-03-01T00:00:00.000Z')
      ).rejects.toThrow('Event not found');
    });

    it('throws on invalid date', async () => {
      const error = new Error('Invalid date format');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.reschedule('event1', 'not-a-date')
      ).rejects.toThrow('Invalid date format');
    });

    it('throws on past date', async () => {
      const error = new Error('Cannot reschedule to a past date');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.reschedule('event1', '2020-01-01T00:00:00.000Z')
      ).rejects.toThrow('Cannot reschedule to a past date');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.reschedule('event1', '2024-03-01T00:00:00.000Z')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Error Handling', () => {
    it('handles timeout errors on getAll', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getAll()).rejects.toThrow('Request timeout');
    });

    it('handles server 500 errors on updateStatus', async () => {
      const error = new Error('Internal server error');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        eventService.updateStatus('event1', 'completed')
      ).rejects.toThrow('Internal server error');
    });

    it('handles 403 forbidden errors on getById', async () => {
      const error = new Error('Forbidden');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventService.getById('event1')).rejects.toThrow('Forbidden');
    });
  });
});
