import apiClient from '@/shared/infrastructure/apiClient';
import type {
  AdminTicketsQuery,
  AdminReplyTicketRequest,
  PaginatedResponse,
  SupportTicket,
  SupportTicketDetail,
} from '@/shared/domain/types';

export const supportApi = {
  list(params: AdminTicketsQuery) {
    return apiClient
      .get<PaginatedResponse<SupportTicket>>('/admin/tickets', { params })
      .then(r => r.data);
  },

  getById(id: string) {
    return apiClient
      .get<SupportTicketDetail>(`/admin/tickets/${id}`)
      .then(r => r.data);
  },

  reply(id: string, body: AdminReplyTicketRequest) {
    return apiClient
      .post(`/admin/tickets/${id}/reply`, body)
      .then(r => r.data);
  },
};
