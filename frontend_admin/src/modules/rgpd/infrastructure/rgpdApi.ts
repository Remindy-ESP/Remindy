import apiClient from '@/shared/infrastructure/apiClient';
import type {
  PaginatedResponse,
  RgpdExport,
  RgpdExportQuery,
} from '@/shared/domain/types';

export const rgpdApi = {
  listExports(params: RgpdExportQuery) {
    return apiClient
      .get<PaginatedResponse<RgpdExport>>('/admin/rgpd/exports', { params })
      .then(r => r.data);
  },

  requestExport(userId: string) {
    return apiClient
      .post<RgpdExport>(`/admin/rgpd/exports/${userId}`)
      .then(r => r.data);
  },

  deleteUserData(userId: string) {
    return apiClient.post(`/admin/rgpd/delete/${userId}`).then(r => r.data);
  },
};
