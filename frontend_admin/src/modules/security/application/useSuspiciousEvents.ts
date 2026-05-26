import { useQuery } from '@tanstack/react-query';
import {
  securityApi,
  type SuspiciousQuery,
} from '@/modules/security/infrastructure/securityApi';

export function useSuspiciousEvents(query: SuspiciousQuery) {
  return useQuery({
    queryKey: ['security', 'suspicious', query],
    queryFn: () => securityApi.listSuspicious(query),
    staleTime: 30_000,
  });
}
