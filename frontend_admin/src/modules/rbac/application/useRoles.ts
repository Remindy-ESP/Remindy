import { useQuery } from '@tanstack/react-query';
import { rbacApi } from '@/modules/rbac/infrastructure/rbacApi';

export function useRoles() {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: () => rbacApi.list(),
    staleTime: 60_000,
  });
}
