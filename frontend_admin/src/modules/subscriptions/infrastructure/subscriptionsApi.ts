import apiClient from '@/shared/infrastructure/apiClient';
import type {
  AdminSubscriptionsQuery,
  PaginatedResponse,
  Subscription,
  UpdateSharedSubscriptionRequest,
} from '@/shared/domain/types';

export const subscriptionsApi = {
  list(params: AdminSubscriptionsQuery) {
    return apiClient
      .get<PaginatedResponse<Subscription>>('/admin/subscriptions', { params })
      .then(r => r.data);
  },

  updateShared(id: string, body: UpdateSharedSubscriptionRequest) {
    return apiClient
      .put<Subscription>(`/admin/shared-subscriptions/${id}`, body)
      .then(r => r.data);
  },
};
