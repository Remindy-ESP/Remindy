import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/modules/users/infrastructure/usersApi';
import type { UserListQuery } from '@/shared/domain/types';

export function useAdminUsers(params: UserListQuery) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => usersApi.list(params),
    staleTime: 30_000,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}
