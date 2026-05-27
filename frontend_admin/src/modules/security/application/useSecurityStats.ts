import { useQuery } from '@tanstack/react-query';
import { securityApi } from '@/modules/security/infrastructure/securityApi';

export function useSecurityStats() {
  return useQuery({
    queryKey: ['security', 'stats'],
    queryFn: () => securityApi.getStats(),
    staleTime: 60_000,
  });
}
