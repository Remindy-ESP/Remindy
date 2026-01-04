import apiClient from './client';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  Event,
} from './types';

/**
 * Subscription Service
 * Handles subscription CRUD operations
 */
class SubscriptionService {
  private readonly BASE_PATH = '/subscriptions';

  /**
   * Get all user subscriptions
   */
  async getAll(filters?: { frequency?: string; categoryId?: string }): Promise<Subscription[]> {
    const params = new URLSearchParams();
    if (filters?.frequency) {
      params.append('frequency', filters.frequency);
    }
    if (filters?.categoryId) {
      params.append('categoryId', filters.categoryId);
    }
    const queryString = params.toString();
    const url = queryString ? `${this.BASE_PATH}?${queryString}` : this.BASE_PATH;
    const response = await apiClient.get<Subscription[]>(url);
    return response.data;
  }

  /**
   * Get subscription by ID
   */
  async getById(id: string): Promise<Subscription> {
    const response = await apiClient.get<Subscription>(
      `${this.BASE_PATH}/${id}`
    );
    return response.data;
  }

  /**
   * Create a new subscription
   */
  async create(data: CreateSubscriptionRequest): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(this.BASE_PATH, data);
    return response.data;
  }

  /**
   * Update a subscription
   */
  async update(
    id: string,
    data: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    const response = await apiClient.put<Subscription>(
      `${this.BASE_PATH}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a subscription
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Pause a subscription
   */
  async pause(id: string): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(
      `${this.BASE_PATH}/${id}/pause`
    );
    return response.data;
  }

  /**
   * Resume a paused subscription
   */
  async resume(id: string): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(
      `${this.BASE_PATH}/${id}/resume`
    );
    return response.data;
  }

  /**
   * Get all events for a subscription
   */
  async getEvents(id: string): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(
      `${this.BASE_PATH}/${id}/events`
    );
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
