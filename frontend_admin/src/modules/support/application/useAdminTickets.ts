import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/modules/support/infrastructure/supportApi';
import type { AdminTicketsQuery } from '@/shared/domain/types';

export function useAdminTickets(params: AdminTicketsQuery) {
  return useQuery({
    queryKey: ['admin-tickets', params],
    queryFn: () => supportApi.list(params),
    staleTime: 30_000,
  });
}

export function useAdminTicket(id: string) {
  return useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: () => supportApi.getById(id),
    enabled: !!id,
    staleTime: 15_000,
  });
}
