import apiClient from '@/shared/infrastructure/apiClient';
import type {
  AdminDocument,
  AdminDocumentQuery,
  PaginatedResponse,
  ReprocessOcrRequest,
} from '@/shared/domain/types';

export const cloudApi = {
  listDocuments(params: AdminDocumentQuery) {
    return apiClient
      .get<PaginatedResponse<AdminDocument>>('/admin/documents', { params })
      .then(r => r.data);
  },

  reprocessOcr(id: string, body: ReprocessOcrRequest) {
    return apiClient
      .post<AdminDocument>(`/admin/documents/${id}/reprocess-ocr`, body)
      .then(r => r.data);
  },
};
