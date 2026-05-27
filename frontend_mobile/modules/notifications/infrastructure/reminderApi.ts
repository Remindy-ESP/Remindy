import client from '@/shared/infrastructure/apiClient';

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
  getAll: async (filters?: ReminderFilter): Promise<Reminder[]> => {
    const response = await client.get<Reminder[]>('/reminders', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Reminder> => {
    const response = await client.get<Reminder>(`/reminders/${id}`);
    return response.data;
  },

  getBySubscription: async (subscriptionId: string): Promise<Reminder[]> => {
    const response = await client.get<Reminder[]>('/reminders', {
      params: { subscription_id: subscriptionId },
    });
    return response.data;
  },

  create: async (data: CreateReminderRequest): Promise<Reminder> => {
    const response = await client.post<Reminder>('/reminders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateReminderRequest): Promise<Reminder> => {
    const response = await client.put<Reminder>(`/reminders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/reminders/${id}`);
  },
};

export default reminderService;
