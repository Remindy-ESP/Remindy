import { useQuery } from '@tanstack/react-query';
import { securityApi } from '@/modules/security/infrastructure/securityApi';
import type { SecurityLogQuery } from '@/shared/domain/types';

export function useSecurityLogs(query: SecurityLogQuery) {
  return useQuery({
    queryKey: ['security', 'logs', query],
    queryFn: () => securityApi.listLogs(query),
    staleTime: 30_000,
  });
}
