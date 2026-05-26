import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { useAdminTicket } from '@/modules/support/application/useAdminTickets';
import { useTicketActions } from '@/modules/support/application/useTicketActions';
import { FullPageLoader, ErrorState } from '@/shared/ui/NetworkStates';
import { PermissionGate } from '@/shared/ui/PermissionGate';
import {
  TicketStatusBadge,
  TICKET_STATUS_LABELS,
} from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketTimeline } from './TicketTimeline';
import { AdminPermission, SupportTicketStatus } from '@/shared/domain/types';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError, refetch } = useAdminTicket(id!);
  const { reply } = useTicketActions(id!);

  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState<SupportTicketStatus | ''>('');

  const handleReply = () => {
    if (!replyMessage.trim()) return;
    reply.mutate(
      {
        message: replyMessage.trim(),
        status: replyStatus || undefined,
      },
      {
        onSuccess: () => {
          setReplyMessage('');
          setReplyStatus('');
        },
      }
    );
  };

  if (isLoading) return <FullPageLoader />;
  if (isError || !ticket) {
    return (
      <ErrorState
        message='Impossible de charger le ticket.'
        onRetry={refetch}
      />
    );
  }

  const isClosed = ticket.status === SupportTicketStatus.CLOSED;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/support')} aria-label='Retour'>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant='h5' fontWeight={700}>
            {ticket.subject}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.user && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ alignSelf: 'center' }}
              >
                {ticket.user.email}
              </Typography>
            )}
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ alignSelf: 'center' }}
            >
              Créé le {new Date(ticket.createdAt).toLocaleString('fr-FR')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Message thread */}
      <TicketTimeline messages={ticket.messages} />

      {/* Reply form */}
      <PermissionGate permission={AdminPermission.SUPPORT_WRITE}>
        <Paper sx={{ p: 2 }}>
          <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
            Répondre
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {isClosed ? (
            <Typography color='text.secondary' fontSize='small'>
              Ce ticket est fermé — aucune réponse possible.
            </Typography>
          ) : (
            <>
              <TextField
                multiline
                minRows={3}
                maxRows={8}
                fullWidth
                placeholder='Votre réponse…'
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                sx={{ mb: 2 }}
                aria-label='Réponse'
              />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  size='small'
                  select
                  label='Changer le statut'
                  value={replyStatus}
                  onChange={e =>
                    setReplyStatus(
                      (e.target.value as SupportTicketStatus) || ''
                    )
                  }
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value=''>Inchangé</MenuItem>
                  {Object.values(SupportTicketStatus).map(s => (
                    <MenuItem key={s} value={s}>
                      {TICKET_STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant='contained'
                  endIcon={<SendIcon />}
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || reply.isPending}
                  sx={{ ml: 'auto' }}
                >
                  Envoyer
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </PermissionGate>
    </Box>
  );
}
