import { useQuery } from '@tanstack/react-query';
import { securityApi } from '@/modules/security/infrastructure/securityApi';

export function useSecurityPolicy() {
  return useQuery({
    queryKey: ['security', 'policy'],
    queryFn: () => securityApi.getPolicy(),
    staleTime: 60_000,
  });
}
