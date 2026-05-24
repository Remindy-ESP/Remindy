import client from './client';

export interface Reminder {
  id: string;
  user_id: string;
  subscription_id?: string;
  type: string;
  days_before: number;
  enabled: boolean;
  channel: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateReminderRequest {
  subscription_id?: string;
  type: string;
  days_before: number;
  enabled?: boolean;
  channel: string;
}

export interface UpdateReminderRequest {
  days_before?: number;
  enabled?: boolean;
  channel?: string;
}

export interface ReminderFilter {
  subscription_id?: string;
  type?: string;
  enabled?: boolean;
  limit?: number;
  sort?: string;
}

export const reminderService = {
  /**
   * Get all reminders for the current user
   */
  getAll: async (filters?: ReminderFilter): Promise<Reminder[]> => {
    try {
      const response = await client.get<Reminder[]>('/reminders', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  /**
   * Get a specific reminder by ID
   */
  getById: async (id: string): Promise<Reminder> => {
    try {
      const response = await client.get<Reminder>(`/reminders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reminder ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get reminders for a specific subscription
   */
  getBySubscription: async (subscriptionId: string): Promise<Reminder[]> => {
    try {
      const response = await client.get<Reminder[]>('/reminders', {
        params: { subscription_id: subscriptionId },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching reminders for subscription ${subscriptionId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new reminder
   */
  create: async (data: CreateReminderRequest): Promise<Reminder> => {
    try {
      const response = await client.post<Reminder>('/reminders', data);
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  /**
   * Update a reminder
   */
  update: async (id: string, data: UpdateReminderRequest): Promise<Reminder> => {
    try {
      const response = await client.put<Reminder>(`/reminders/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating reminder ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a reminder
   */
  delete: async (id: string): Promise<void> => {
    try {
      await client.delete(`/reminders/${id}`);
    } catch (error) {
      console.error(`Error deleting reminder ${id}:`, error);
      throw error;
    }
  },
};

export default reminderService;
