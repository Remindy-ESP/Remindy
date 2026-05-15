import client from './client';
import { Notification, NotificationFilter, NotificationResponse, PaginatedResponse } from './types';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (filters?: NotificationFilter) => {
    try {
      const response = await client.get<Notification[]>('/notifications', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string) => {
    try {
      const response = await client.put<Notification>(`/notifications/${id}/mark-read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  /**
   * Snooze a notification
   */
  snooze: async (id: string, snoozedUntil: string) => {
    try {
      const response = await client.put<Notification>(`/notifications/${id}/snooze`, {
        snoozedUntil,
      });
      return response.data;
    } catch (error) {
      console.error(`Error snoozing notification ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await client.put<{ message: string; count: number }>('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Register Expo push token with the backend
   */
  registerPushToken: async (token: string) => {
    try {
      const response = await client.post<{ message: string }>('/notifications/push-token', {
        token,
      });
      return response.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  },

  /**
   * Unregister Expo push token from the backend
   */
  unregisterPushToken: async () => {
    try {
      const response = await client.delete<{ message: string }>('/notifications/push-token');
      return response.data;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  },

  /**
   * Delete a notification (soft delete)
   */
  deleteNotification: async (id: string) => {
    try {
      const response = await client.delete<{ message: string }>(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },
};

export default notificationService;

