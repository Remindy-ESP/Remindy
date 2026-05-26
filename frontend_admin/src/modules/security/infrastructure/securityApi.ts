import apiClient from '@/shared/infrastructure/apiClient';
import type {
  BlockIpRequest,
  BlockedIp,
  IpActivity,
  PaginatedResponse,
  SecurityLog,
  SecurityLogQuery,
  SecurityPolicy,
  SecurityStats,
  UpdateSecurityPolicyRequest,
} from '@/shared/domain/types';

export interface SuspiciousQuery {
  page?: number;
  limit?: number;
}

export interface BlockedIpsQuery {
  all?: boolean;
}

export const securityApi = {
  listLogs(query: SecurityLogQuery) {
    return apiClient
      .get<PaginatedResponse<SecurityLog>>('/admin/security/logs', {
        params: query,
      })
      .then(r => r.data);
  },

  listSuspicious(query: SuspiciousQuery = {}) {
    return apiClient
      .get<PaginatedResponse<SecurityLog>>('/admin/security/logs/suspicious', {
        params: query,
      })
      .then(r => r.data);
  },

  listBlockedIps(query: BlockedIpsQuery = {}) {
    return apiClient
      .get<BlockedIp[]>('/admin/security/blocked-ips', {
        params: query.all ? { all: 'true' } : {},
      })
      .then(r => r.data);
  },

  blockIp(body: BlockIpRequest) {
    return apiClient
      .post<BlockedIp>('/admin/security/blocked-ips', body)
      .then(r => r.data);
  },

  unblockIp(id: string) {
    return apiClient
      .delete<{ ok: true }>(`/admin/security/blocked-ips/${id}`)
      .then(r => r.data);
  },

  getIpActivity(ip: string) {
    return apiClient
      .get<IpActivity>(`/admin/security/ip-activity/${encodeURIComponent(ip)}`)
      .then(r => r.data);
  },

  getPolicy() {
    return apiClient
      .get<SecurityPolicy>('/admin/security/policy')
      .then(r => r.data);
  },

  updatePolicy(body: UpdateSecurityPolicyRequest) {
    return apiClient
      .patch<SecurityPolicy>('/admin/security/policy', body)
      .then(r => r.data);
  },

  getStats() {
    return apiClient
      .get<SecurityStats>('/admin/security/stats')
      .then(r => r.data);
  },
};
