import apiClient from '@/shared/infrastructure/apiClient';
import type { DashboardOverview } from '@/shared/domain/types';

export type DashboardPeriod = '7d' | '30d' | '90d';

export interface DashboardQuery {
  period?: DashboardPeriod;
}

export const dashboardApi = {
  getOverview(query: DashboardQuery = {}) {
    return apiClient
      .get<DashboardOverview>('/admin/dashboard', { params: query })
      .then(r => r.data);
  },
};
