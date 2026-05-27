import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rgpdApi } from '@/modules/rgpd/infrastructure/rgpdApi';

export function useRgpdActions() {
  const qc = useQueryClient();

  const requestExport = useMutation({
    mutationFn: (userId: string) => rgpdApi.requestExport(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rgpd-exports'] });
      qc.invalidateQueries({ queryKey: ['admin-rgpd-kpi'] });
      toast.success('Export RGPD demandé');
    },
    onError: () => toast.error("Échec de la demande d'export"),
  });

  const deleteUserData = useMutation({
    mutationFn: (userId: string) => rgpdApi.deleteUserData(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-rgpd-exports'] });
      toast.success('Données utilisateur anonymisées');
    },
    onError: () => toast.error("Échec de l'anonymisation"),
  });

  return { requestExport, deleteUserData };
}
