import apiClient from '@/shared/infrastructure/apiClient';
import type {
  AuditLog,
  AuditLogQuery,
  AuditLogsResponse,
} from '@/shared/domain/types';

export const auditApi = {
  list(params: AuditLogQuery) {
    return apiClient
      .get<AuditLogsResponse>('/audit/logs', { params })
      .then(r => r.data);
  },

  getById(id: string) {
    return apiClient.get<AuditLog>(`/audit/logs/${id}`).then(r => r.data);
  },

  export(
    params: Omit<AuditLogQuery, 'page' | 'limit'> & { format: 'csv' | 'json' }
  ) {
    return apiClient
      .get(`/audit/export`, { params, responseType: 'blob' })
      .then(r => r.data as Blob);
  },
};
