import { useQuery } from '@tanstack/react-query';
import {
  dashboardApi,
  type DashboardQuery,
} from '@/modules/dashboard/infrastructure/dashboardApi';

const SIXTY_SECONDS = 60_000;

interface UseDashboardOptions {
  enabled?: boolean;
}

export function useDashboard(
  query: DashboardQuery = {},
  options: UseDashboardOptions = {}
) {
  return useQuery({
    queryKey: ['admin-dashboard', query],
    queryFn: () => dashboardApi.getOverview(query),
    staleTime: SIXTY_SECONDS,
    refetchInterval: SIXTY_SECONDS,
    refetchOnWindowFocus: false,
    enabled: options.enabled ?? true,
  });
}
