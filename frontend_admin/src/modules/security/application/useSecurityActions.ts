import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { securityApi } from '@/modules/security/infrastructure/securityApi';
import type {
  BlockIpRequest,
  UpdateSecurityPolicyRequest,
} from '@/shared/domain/types';

function extractMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message ?? fallback;
}

export function useSecurityActions() {
  const queryClient = useQueryClient();

  const blockIp = useMutation({
    mutationFn: (body: BlockIpRequest) => securityApi.blockIp(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      toast.success('IP bloquée.');
    },
    onError: err => {
      toast.error(extractMessage(err, "Échec du blocage de l'IP."));
    },
  });

  const unblockIp = useMutation({
    mutationFn: (id: string) => securityApi.unblockIp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'stats'] });
      toast.success('IP débloquée.');
    },
    onError: err => {
      toast.error(extractMessage(err, "Échec du déblocage de l'IP."));
    },
  });

  const updatePolicy = useMutation({
    mutationFn: (body: UpdateSecurityPolicyRequest) =>
      securityApi.updatePolicy(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'policy'] });
      toast.success('Politique de sécurité mise à jour.');
    },
    onError: err => {
      toast.error(
        extractMessage(err, 'Échec de la mise à jour de la politique.')
      );
    },
  });

  return { blockIp, unblockIp, updatePolicy };
}
