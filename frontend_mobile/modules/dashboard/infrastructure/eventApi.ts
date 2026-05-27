import apiClient from '@/shared/infrastructure/apiClient';
import { Event } from '@/services/api/types';

/**
 * Event Service
 * Handles calendar event operations
 */
class EventService {
  private readonly BASE_PATH = '/calendar/events';

  /**
   * Get all events for the current user
   */
  async getAll(): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(this.BASE_PATH, {
      params: { limit: 1000 },
    });
    return response.data;
  }

  /**
   * Get events for a specific date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(this.BASE_PATH, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Get event by ID
   */
  async getById(id: string): Promise<Event> {
    const response = await apiClient.get<Event>(`${this.BASE_PATH}/${id}`);
    return response.data;
  }

  /**
   * Update event status
   */
  async updateStatus(
    id: string,
    status: 'scheduled' | 'completed' | 'canceled' | 'failed'
  ): Promise<Event> {
    const response = await apiClient.patch<Event>(
      `${this.BASE_PATH}/${id}/status`,
      { status }
    );
    return response.data;
  }

  /**
   * Reschedule an event
   */
  async reschedule(id: string, newDate: string): Promise<Event> {
    const response = await apiClient.patch<Event>(
      `${this.BASE_PATH}/${id}/reschedule`,
      { newDate }
    );
    return response.data;
  }
}

export const eventService = new EventService();
export default eventService;
