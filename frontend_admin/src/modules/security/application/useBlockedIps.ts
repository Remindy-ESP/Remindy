import { useQuery } from '@tanstack/react-query';
import { securityApi } from '@/modules/security/infrastructure/securityApi';

export function useBlockedIps(includeExpired: boolean) {
  return useQuery({
    queryKey: ['security', 'blocked-ips', { includeExpired }],
    queryFn: () => securityApi.listBlockedIps({ all: includeExpired }),
    staleTime: 30_000,
  });
}

export function useIpActivity(ip: string | null) {
  return useQuery({
    queryKey: ['security', 'ip-activity', ip],
    queryFn: () => securityApi.getIpActivity(ip!),
    enabled: !!ip,
    staleTime: 15_000,
  });
}
