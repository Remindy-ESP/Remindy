import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/modules/support/infrastructure/supportApi';
import type { AdminReplyTicketRequest } from '@/shared/domain/types';
import toast from 'react-hot-toast';

export function useTicketActions(ticketId: string) {
  const qc = useQueryClient();

  const reply = useMutation({
    mutationFn: (body: AdminReplyTicketRequest) =>
      supportApi.reply(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Réponse envoyée');
    },
    onError: () => toast.error("Échec de l'envoi"),
  });

  return { reply };
}
