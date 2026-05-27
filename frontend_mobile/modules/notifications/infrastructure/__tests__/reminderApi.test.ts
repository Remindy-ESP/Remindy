import { reminderService, Reminder, CreateReminderRequest, UpdateReminderRequest, ReminderFilter } from '@/modules/notifications/infrastructure/reminderApi';
import client from '@/shared/infrastructure/apiClient';

jest.mock('@/shared/infrastructure/apiClient', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockAxiosInstance,
    apiClient: { getBaseURL: jest.fn(() => 'http://localhost:3000') },
  };
});

const mockClient = client as jest.Mocked<typeof client>;

describe('reminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReminder: Reminder = {
    id: 'rem-1',
    user_id: 'user-1',
    subscription_id: 'sub-1',
    type: 'payment_due',
    days_before: 3,
    enabled: true,
    channel: 'push',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  };

  const mockReminders: Reminder[] = [
    mockReminder,
    {
      id: 'rem-2',
      user_id: 'user-1',
      subscription_id: 'sub-2',
      type: 'trial_ending',
      days_before: 7,
      enabled: true,
      channel: 'email',
      created_at: '2026-05-02T00:00:00.000Z',
      updated_at: '2026-05-02T00:00:00.000Z',
    },
  ];

  // ─── getAll ───────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('fetches all reminders without filters', async () => {
      mockClient.get.mockResolvedValue({ data: mockReminders });

      const result = await reminderService.getAll();

      expect(mockClient.get).toHaveBeenCalledWith('/reminders', { params: undefined });
      expect(result).toEqual(mockReminders);
    });

    it('fetches reminders with a filter', async () => {
      const filter: ReminderFilter = { enabled: true, limit: 5 };
      mockClient.get.mockResolvedValue({ data: [mockReminder] });

      const result = await reminderService.getAll(filter);

      expect(mockClient.get).toHaveBeenCalledWith('/reminders', { params: filter });
      expect(result).toEqual([mockReminder]);
    });

    it('returns empty array when no reminders exist', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      const result = await reminderService.getAll();

      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'));

      await expect(reminderService.getAll()).rejects.toThrow('Network error');
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('fetches a reminder by ID', async () => {
      mockClient.get.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.getById('rem-1');

      expect(mockClient.get).toHaveBeenCalledWith('/reminders/rem-1');
      expect(result).toEqual(mockReminder);
    });

    it('returns all fields of the reminder', async () => {
      mockClient.get.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.getById('rem-1');

      expect(result.id).toBe('rem-1');
      expect(result.type).toBe('payment_due');
      expect(result.days_before).toBe(3);
      expect(result.enabled).toBe(true);
    });

    it('throws when reminder is not found', async () => {
      mockClient.get.mockRejectedValue(new Error('Not found'));

      await expect(reminderService.getById('missing-id')).rejects.toThrow('Not found');
    });
  });

  // ─── getBySubscription ────────────────────────────────────────────────────

  describe('getBySubscription', () => {
    it('fetches reminders for a specific subscription', async () => {
      mockClient.get.mockResolvedValue({ data: [mockReminder] });

      const result = await reminderService.getBySubscription('sub-1');

      expect(mockClient.get).toHaveBeenCalledWith('/reminders', { params: { subscription_id: 'sub-1' } });
      expect(result).toEqual([mockReminder]);
    });

    it('returns empty array when subscription has no reminders', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      const result = await reminderService.getBySubscription('sub-99');

      expect(mockClient.get).toHaveBeenCalledWith('/reminders', { params: { subscription_id: 'sub-99' } });
      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'));

      await expect(reminderService.getBySubscription('sub-1')).rejects.toThrow('Network error');
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a reminder and returns the created entity', async () => {
      const createData: CreateReminderRequest = {
        subscription_id: 'sub-1',
        type: 'payment_due',
        days_before: 3,
        enabled: true,
        channel: 'push',
      };
      mockClient.post.mockResolvedValue({ data: mockReminder });

      const result = await reminderService.create(createData);

      expect(mockClient.post).toHaveBeenCalledWith('/reminders', createData);
      expect(result).toEqual(mockReminder);
    });

    it('creates a reminder without optional fields', async () => {
      const createData: CreateReminderRequest = {
        type: 'trial_ending',
        days_before: 7,
        channel: 'email',
      };
      const createdReminder: Reminder = { ...mockReminder, ...createData, subscription_id: undefined };
      mockClient.post.mockResolvedValue({ data: createdReminder });

      const result = await reminderService.create(createData);

      expect(mockClient.post).toHaveBeenCalledWith('/reminders', createData);
      expect(result.type).toBe('trial_ending');
    });

    it('throws on validation error', async () => {
      mockClient.post.mockRejectedValue(new Error('Validation failed'));

      await expect(
        reminderService.create({ type: '', days_before: 0, channel: 'push' })
      ).rejects.toThrow('Validation failed');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates a reminder and returns the updated entity', async () => {
      const updateData: UpdateReminderRequest = { days_before: 5, enabled: false };
      const updatedReminder: Reminder = { ...mockReminder, ...updateData };
      mockClient.put.mockResolvedValue({ data: updatedReminder });

      const result = await reminderService.update('rem-1', updateData);

      expect(mockClient.put).toHaveBeenCalledWith('/reminders/rem-1', updateData);
      expect(result.days_before).toBe(5);
      expect(result.enabled).toBe(false);
    });

    it('updates reminder with partial data', async () => {
      const updateData: UpdateReminderRequest = { channel: 'email' };
      const updatedReminder: Reminder = { ...mockReminder, channel: 'email' };
      mockClient.put.mockResolvedValue({ data: updatedReminder });

      const result = await reminderService.update('rem-1', updateData);

      expect(mockClient.put).toHaveBeenCalledWith('/reminders/rem-1', updateData);
      expect(result.channel).toBe('email');
    });

    it('throws when reminder is not found', async () => {
      mockClient.put.mockRejectedValue(new Error('Reminder not found'));

      await expect(reminderService.update('missing', { enabled: false })).rejects.toThrow('Reminder not found');
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes a reminder by ID', async () => {
      mockClient.delete.mockResolvedValue({ data: undefined });

      await reminderService.delete('rem-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/reminders/rem-1');
    });

    it('calls the correct URL with the given ID', async () => {
      mockClient.delete.mockResolvedValue({ data: undefined });

      await reminderService.delete('rem-xyz');

      expect(mockClient.delete).toHaveBeenCalledWith('/reminders/rem-xyz');
    });

    it('throws when reminder is not found', async () => {
      mockClient.delete.mockRejectedValue(new Error('Reminder not found'));

      await expect(reminderService.delete('missing')).rejects.toThrow('Reminder not found');
    });
  });

  // ─── General error handling ───────────────────────────────────────────────

  describe('Error Handling', () => {
    it('handles timeout errors on getAll', async () => {
      mockClient.get.mockRejectedValue(new Error('Request timeout'));

      await expect(reminderService.getAll()).rejects.toThrow('Request timeout');
    });

    it('handles 401 unauthorized on create', async () => {
      mockClient.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        reminderService.create({ type: 'payment_due', days_before: 1, channel: 'push' })
      ).rejects.toThrow('Unauthorized');
    });

    it('handles 500 server error on update', async () => {
      mockClient.put.mockRejectedValue(new Error('Internal server error'));

      await expect(reminderService.update('rem-1', { enabled: true })).rejects.toThrow('Internal server error');
    });
  });
});
