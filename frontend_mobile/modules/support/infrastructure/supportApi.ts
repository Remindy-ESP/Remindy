import apiClient from '@/shared/infrastructure/apiClient';

export type SupportTicketStatus = 'open' | 'pending_user' | 'resolved' | 'closed';
export type SupportTicketCategory =
  | 'technical'
  | 'billing'
  | 'account'
  | 'subscription'
  | 'bug'
  | 'feature_request'
  | 'other';

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  category: SupportTicketCategory | null;
  createdAt: string;
  lastReplyAt: string | null;
}

export interface SupportTicketMessage {
  id: string;
  authorType: 'user' | 'admin' | 'system';
  body: string;
  createdAt: string;
  author: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  priority: string;
  messages: SupportTicketMessage[];
}

export interface SupportTicketsPage {
  items: SupportTicketSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  category?: SupportTicketCategory;
}

class SupportService {
  private readonly BASE = '/support/tickets';

  async getCategories(): Promise<SupportTicketCategory[]> {
    const response = await apiClient.get<SupportTicketCategory[]>(`${this.BASE}/categories`);
    return response.data;
  }

  async create(data: CreateTicketRequest): Promise<SupportTicketDetail> {
    const response = await apiClient.post<SupportTicketDetail>(this.BASE, data);
    return response.data;
  }

  async listMine(params?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    page?: number;
    limit?: number;
  }): Promise<SupportTicketsPage> {
    const response = await apiClient.get<SupportTicketsPage>(`${this.BASE}/me`, { params });
    return response.data;
  }

  async getById(id: string): Promise<SupportTicketDetail> {
    const response = await apiClient.get<SupportTicketDetail>(`${this.BASE}/${id}`);
    return response.data;
  }

  async reply(id: string, message: string): Promise<void> {
    await apiClient.post(`${this.BASE}/${id}/reply`, { message });
  }
}

export const supportService = new SupportService();
export default supportService;
