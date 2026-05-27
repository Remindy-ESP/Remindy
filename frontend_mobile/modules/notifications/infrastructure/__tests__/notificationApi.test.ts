import { notificationService } from '@/modules/notifications/infrastructure/notificationApi';
import client from '@/shared/infrastructure/apiClient';
import { Notification, NotificationFilter } from '@/services/api/types';

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

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNotification: Notification = {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'reminder',
    channel: 'push',
    title: 'Payment due',
    body: 'Your Netflix subscription is due tomorrow.',
    status: 'pending',
    created_at: '2026-05-01T00:00:00.000Z',
  };

  const mockNotifications: Notification[] = [
    mockNotification,
    {
      id: 'notif-2',
      user_id: 'user-1',
      type: 'payment_overdue',
      channel: 'email',
      title: 'Overdue payment',
      body: 'Your Spotify subscription is overdue.',
      status: 'sent',
      created_at: '2026-05-02T00:00:00.000Z',
    },
  ];

  // ─── getNotifications ─────────────────────────────────────────────────────

  describe('getNotifications', () => {
    it('fetches all notifications without filters', async () => {
      mockClient.get.mockResolvedValue({ data: mockNotifications });

      const result = await notificationService.getNotifications();

      expect(mockClient.get).toHaveBeenCalledWith('/notifications', { params: undefined });
      expect(result).toEqual(mockNotifications);
    });

    it('fetches notifications with status filter', async () => {
      const filter: NotificationFilter = { status: 'pending' };
      mockClient.get.mockResolvedValue({ data: [mockNotification] });

      const result = await notificationService.getNotifications(filter);

      expect(mockClient.get).toHaveBeenCalledWith('/notifications', { params: filter });
      expect(result).toEqual([mockNotification]);
    });

    it('fetches notifications with multiple filters', async () => {
      const filter: NotificationFilter = { type: 'reminder', channel: 'push', limit: 10 };
      mockClient.get.mockResolvedValue({ data: [mockNotification] });

      const result = await notificationService.getNotifications(filter);

      expect(mockClient.get).toHaveBeenCalledWith('/notifications', { params: filter });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no notifications exist', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      const result = await notificationService.getNotifications();

      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      mockClient.get.mockRejectedValue(new Error('Network error'));

      await expect(notificationService.getNotifications()).rejects.toThrow('Network error');
    });
  });

  // ─── markAsRead ───────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read and returns updated notification', async () => {
      const readNotification: Notification = { ...mockNotification, read_at: '2026-05-10T10:00:00.000Z' };
      mockClient.put.mockResolvedValue({ data: readNotification });

      const result = await notificationService.markAsRead('notif-1');

      expect(mockClient.put).toHaveBeenCalledWith('/notifications/notif-1/mark-read');
      expect(result).toEqual(readNotification);
    });

    it('calls the correct URL with the given ID', async () => {
      mockClient.put.mockResolvedValue({ data: mockNotification });

      await notificationService.markAsRead('abc-123');

      expect(mockClient.put).toHaveBeenCalledWith('/notifications/abc-123/mark-read');
    });

    it('throws when notification is not found', async () => {
      mockClient.put.mockRejectedValue(new Error('Notification not found'));

      await expect(notificationService.markAsRead('missing-id')).rejects.toThrow('Notification not found');
    });
  });

  // ─── snooze ───────────────────────────────────────────────────────────────

  describe('snooze', () => {
    it('snoozes a notification until the given date', async () => {
      const snoozedUntil = '2026-05-15T08:00:00.000Z';
      const snoozedNotification: Notification = { ...mockNotification, status: 'snoozed', snoozed_until: snoozedUntil };
      mockClient.put.mockResolvedValue({ data: snoozedNotification });

      const result = await notificationService.snooze('notif-1', snoozedUntil);

      expect(mockClient.put).toHaveBeenCalledWith('/notifications/notif-1/snooze', { snoozedUntil });
      expect(result.status).toBe('snoozed');
      expect(result.snoozed_until).toBe(snoozedUntil);
    });

    it('passes the correct body with snoozedUntil', async () => {
      const snoozedUntil = '2026-06-01T00:00:00.000Z';
      mockClient.put.mockResolvedValue({ data: mockNotification });

      await notificationService.snooze('notif-2', snoozedUntil);

      expect(mockClient.put).toHaveBeenCalledWith('/notifications/notif-2/snooze', { snoozedUntil });
    });

    it('throws on server error', async () => {
      mockClient.put.mockRejectedValue(new Error('Internal server error'));

      await expect(notificationService.snooze('notif-1', '2026-05-15T08:00:00.000Z')).rejects.toThrow('Internal server error');
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all notifications as read and returns count', async () => {
      mockClient.put.mockResolvedValue({ data: { message: 'All marked as read', count: 5 } });

      const result = await notificationService.markAllAsRead();

      expect(mockClient.put).toHaveBeenCalledWith('/notifications/mark-all-read');
      expect(result.message).toBe('All marked as read');
      expect(result.count).toBe(5);
    });

    it('returns count of zero when no unread notifications', async () => {
      mockClient.put.mockResolvedValue({ data: { message: 'Nothing to mark', count: 0 } });

      const result = await notificationService.markAllAsRead();

      expect(result.count).toBe(0);
    });

    it('throws on network error', async () => {
      mockClient.put.mockRejectedValue(new Error('Network error'));

      await expect(notificationService.markAllAsRead()).rejects.toThrow('Network error');
    });
  });

  // ─── registerPushToken ────────────────────────────────────────────────────

  describe('registerPushToken', () => {
    it('registers a push token successfully', async () => {
      mockClient.post.mockResolvedValue({ data: { message: 'Token registered' } });

      const result = await notificationService.registerPushToken('ExponentPushToken[xxxx]');

      expect(mockClient.post).toHaveBeenCalledWith('/notifications/push-token', { token: 'ExponentPushToken[xxxx]' });
      expect(result.message).toBe('Token registered');
    });

    it('passes the token in the request body', async () => {
      const token = 'ExponentPushToken[test-device]';
      mockClient.post.mockResolvedValue({ data: { message: 'OK' } });

      await notificationService.registerPushToken(token);

      expect(mockClient.post).toHaveBeenCalledWith('/notifications/push-token', { token });
    });

    it('throws when token registration fails', async () => {
      mockClient.post.mockRejectedValue(new Error('Invalid token'));

      await expect(notificationService.registerPushToken('bad-token')).rejects.toThrow('Invalid token');
    });
  });

  // ─── unregisterPushToken ──────────────────────────────────────────────────

  describe('unregisterPushToken', () => {
    it('unregisters the push token successfully', async () => {
      mockClient.delete.mockResolvedValue({ data: { message: 'Token unregistered' } });

      const result = await notificationService.unregisterPushToken();

      expect(mockClient.delete).toHaveBeenCalledWith('/notifications/push-token');
      expect(result.message).toBe('Token unregistered');
    });

    it('throws on server error', async () => {
      mockClient.delete.mockRejectedValue(new Error('Server error'));

      await expect(notificationService.unregisterPushToken()).rejects.toThrow('Server error');
    });
  });

  // ─── deleteNotification ───────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes a notification by ID', async () => {
      mockClient.delete.mockResolvedValue({ data: { message: 'Notification deleted' } });

      const result = await notificationService.deleteNotification('notif-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/notifications/notif-1');
      expect(result.message).toBe('Notification deleted');
    });

    it('calls the correct URL with the given ID', async () => {
      mockClient.delete.mockResolvedValue({ data: { message: 'OK' } });

      await notificationService.deleteNotification('abc-xyz');

      expect(mockClient.delete).toHaveBeenCalledWith('/notifications/abc-xyz');
    });

    it('throws when notification is not found', async () => {
      mockClient.delete.mockRejectedValue(new Error('Not found'));

      await expect(notificationService.deleteNotification('missing')).rejects.toThrow('Not found');
    });
  });

  // ─── deleteAllNotifications ───────────────────────────────────────────────

  describe('deleteAllNotifications', () => {
    it('deletes all notifications and returns confirmation message', async () => {
      mockClient.delete.mockResolvedValue({ data: { message: 'All notifications deleted' } });

      const result = await notificationService.deleteAllNotifications();

      expect(mockClient.delete).toHaveBeenCalledWith('/notifications/delete-all');
      expect(result.message).toBe('All notifications deleted');
    });

    it('throws on network error', async () => {
      mockClient.delete.mockRejectedValue(new Error('Network error'));

      await expect(notificationService.deleteAllNotifications()).rejects.toThrow('Network error');
    });
  });

  // ─── General error handling ───────────────────────────────────────────────

  describe('Error Handling', () => {
    it('handles timeout errors on getNotifications', async () => {
      mockClient.get.mockRejectedValue(new Error('Request timeout'));

      await expect(notificationService.getNotifications()).rejects.toThrow('Request timeout');
    });

    it('handles 403 forbidden on markAsRead', async () => {
      mockClient.put.mockRejectedValue(new Error('Forbidden'));

      await expect(notificationService.markAsRead('notif-1')).rejects.toThrow('Forbidden');
    });

    it('handles 500 server error on registerPushToken', async () => {
      mockClient.post.mockRejectedValue(new Error('Internal server error'));

      await expect(notificationService.registerPushToken('some-token')).rejects.toThrow('Internal server error');
    });
  });
});
