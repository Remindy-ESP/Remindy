import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { auditApi } from '@/modules/audit/infrastructure/auditApi';
import type { AuditLogQuery } from '@/shared/domain/types';

export function useAuditLogs(params: AuditLogQuery) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditApi.list(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => auditApi.getById(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });
}
