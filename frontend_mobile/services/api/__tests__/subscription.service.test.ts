import { subscriptionService } from '@/modules/subscriptions/infrastructure/subscriptionApi';
import apiClient from '@/shared/infrastructure/apiClient';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  Event,
} from '../types';

// Mock the API client
jest.mock('@/shared/infrastructure/apiClient');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSubscription: Subscription = {
    id: '1',
    name: 'Netflix',
    amount: 15.99,
    frequency: 'monthly',
    startDate: '2024-01-01T00:00:00.000Z',
    nextDueDate: '2024-02-01T00:00:00.000Z',
    status: 'active',
    currency: 'EUR',
    notes: 'Streaming service',
    categoryId: 'cat1',
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockSubscriptions: Subscription[] = [
    mockSubscription,
    {
      id: '2',
      name: 'Spotify',
      amount: 9.99,
      frequency: 'monthly',
      startDate: '2024-01-01T00:00:00.000Z',
      nextDueDate: '2024-02-01T00:00:00.000Z',
      status: 'active',
      currency: 'EUR',
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Netflix - February',
      subscriptionId: '1',
      dueDate: '2024-02-01T00:00:00.000Z',
      status: 'scheduled',
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('getAll', () => {
    it('fetches all subscriptions without filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSubscriptions });

      const result = await subscriptionService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/subscriptions');
      expect(result).toEqual(mockSubscriptions);
    });

    it('fetches subscriptions with frequency filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockSubscription] });

      const result = await subscriptionService.getAll({ frequency: 'monthly' });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/subscriptions?frequency=monthly'
      );
      expect(result).toEqual([mockSubscription]);
    });

    it('fetches subscriptions with category filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockSubscription] });

      const result = await subscriptionService.getAll({ categoryId: 'cat1' });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/subscriptions?categoryId=cat1'
      );
      expect(result).toEqual([mockSubscription]);
    });

    it('fetches subscriptions with multiple filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: [mockSubscription] });

      const result = await subscriptionService.getAll({
        frequency: 'monthly',
        categoryId: 'cat1',
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/subscriptions?frequency=monthly&categoryId=cat1'
      );
      expect(result).toEqual([mockSubscription]);
    });

    it('handles empty response', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await subscriptionService.getAll();

      expect(result).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(subscriptionService.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('fetches subscription by ID', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSubscription });

      const result = await subscriptionService.getById('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/subscriptions/1');
      expect(result).toEqual(mockSubscription);
    });

    it('handles not found error', async () => {
      const error = new Error('Not found');
      mockApiClient.get.mockRejectedValue(error);

      await expect(subscriptionService.getById('999')).rejects.toThrow(
        'Not found'
      );
    });
  });

  describe('create', () => {
    it('creates a new subscription', async () => {
      const createData: CreateSubscriptionRequest = {
        name: 'New Subscription',
        amount: 19.99,
        frequency: 'monthly',
        startDate: '2024-01-01',
        currency: 'EUR',
        status: 'active',
      };

      mockApiClient.post.mockResolvedValue({
        data: { ...mockSubscription, ...createData },
      });

      const result = await subscriptionService.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/subscriptions',
        createData
      );
      expect(result).toMatchObject(createData);
    });

    it('creates subscription with optional fields', async () => {
      const createData: CreateSubscriptionRequest = {
        name: 'New Subscription',
        amount: 19.99,
        frequency: 'monthly',
        startDate: '2024-01-01',
        currency: 'EUR',
        status: 'active',
        notes: 'Test notes',
        categoryId: 'cat1',
        nextDueDate: '2024-02-01',
      };

      mockApiClient.post.mockResolvedValue({
        data: { ...mockSubscription, ...createData },
      });

      const result = await subscriptionService.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/subscriptions',
        createData
      );
      expect(result.notes).toBe('Test notes');
      expect(result.categoryId).toBe('cat1');
    });

    it('handles validation errors', async () => {
      const error = new Error('Validation failed');
      mockApiClient.post.mockRejectedValue(error);

      const createData: CreateSubscriptionRequest = {
        name: '',
        amount: 0,
        frequency: 'monthly',
        startDate: '2024-01-01',
        currency: 'EUR',
        status: 'active',
      };

      await expect(subscriptionService.create(createData)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('update', () => {
    it('updates a subscription', async () => {
      const updateData: UpdateSubscriptionRequest = {
        name: 'Updated Netflix',
        amount: 17.99,
      };

      mockApiClient.put.mockResolvedValue({
        data: { ...mockSubscription, ...updateData },
      });

      const result = await subscriptionService.update('1', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/subscriptions/1',
        updateData
      );
      expect(result.name).toBe('Updated Netflix');
      expect(result.amount).toBe(17.99);
    });

    it('updates subscription with partial data', async () => {
      const updateData: UpdateSubscriptionRequest = {
        notes: 'Updated notes',
      };

      mockApiClient.put.mockResolvedValue({
        data: { ...mockSubscription, ...updateData },
      });

      const result = await subscriptionService.update('1', updateData);

      expect(result.notes).toBe('Updated notes');
    });

    it('handles not found error', async () => {
      const error = new Error('Subscription not found');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        subscriptionService.update('999', { name: 'Test' })
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('delete', () => {
    it('deletes a subscription', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await subscriptionService.delete('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/subscriptions/1');
    });

    it('handles not found error', async () => {
      const error = new Error('Subscription not found');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(subscriptionService.delete('999')).rejects.toThrow(
        'Subscription not found'
      );
    });
  });

  describe('pause', () => {
    it('pauses an active subscription', async () => {
      const pausedSubscription = { ...mockSubscription, status: 'paused' as const };
      mockApiClient.post.mockResolvedValue({ data: pausedSubscription });

      const result = await subscriptionService.pause('1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/subscriptions/1/pause');
      expect(result.status).toBe('paused');
    });

    it('handles already paused subscription', async () => {
      const error = new Error('Subscription already paused');
      mockApiClient.post.mockRejectedValue(error);

      await expect(subscriptionService.pause('1')).rejects.toThrow(
        'Subscription already paused'
      );
    });
  });

  describe('resume', () => {
    it('resumes a paused subscription', async () => {
      const resumedSubscription = { ...mockSubscription, status: 'active' as const };
      mockApiClient.post.mockResolvedValue({ data: resumedSubscription });

      const result = await subscriptionService.resume('1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/subscriptions/1/resume');
      expect(result.status).toBe('active');
    });

    it('handles already active subscription', async () => {
      const error = new Error('Subscription already active');
      mockApiClient.post.mockRejectedValue(error);

      await expect(subscriptionService.resume('1')).rejects.toThrow(
        'Subscription already active'
      );
    });
  });

  describe('getEvents', () => {
    it('fetches events for a subscription', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEvents });

      const result = await subscriptionService.getEvents('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/subscriptions/1/events');
      expect(result).toEqual(mockEvents);
    });

    it('handles empty events', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await subscriptionService.getEvents('1');

      expect(result).toEqual([]);
    });

    it('handles subscription not found', async () => {
      const error = new Error('Subscription not found');
      mockApiClient.get.mockRejectedValue(error);

      await expect(subscriptionService.getEvents('999')).rejects.toThrow(
        'Subscription not found'
      );
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(subscriptionService.getAll()).rejects.toThrow(
        'Network error'
      );
    });

    it('handles timeout errors', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(subscriptionService.getById('1')).rejects.toThrow(
        'Request timeout'
      );
    });

    it('handles server errors', async () => {
      const error = new Error('Internal server error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        subscriptionService.create({
          name: 'Test',
          amount: 10,
          frequency: 'monthly',
          startDate: '2024-01-01',
          currency: 'EUR',
          status: 'active',
        })
      ).rejects.toThrow('Internal server error');
    });
  });
});
