import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
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
import type { SupportTicketMessage } from '@/shared/domain/types';
import {
  AdminPermission,
  SupportTicketStatus,
  SupportTicketAuthorType,
} from '@/shared/domain/types';
import { STATUS_LABELS, STATUS_COLORS } from './ticketStatusMeta';

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  const isAdmin = message.authorType === SupportTicketAuthorType.ADMIN;
  const isSystem = message.authorType === SupportTicketAuthorType.SYSTEM;

  const authorLabel = isSystem
    ? 'Système'
    : message.author
      ? [message.author.firstName, message.author.lastName]
          .filter(Boolean)
          .join(' ') || message.author.email
      : isAdmin
        ? 'Admin'
        : 'Utilisateur';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAdmin || isSystem ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ mb: 0.5, px: 0.5 }}
      >
        {authorLabel} · {new Date(message.createdAt).toLocaleString('fr-FR')}
      </Typography>
      <Box
        sx={{
          maxWidth: '75%',
          bgcolor: isAdmin
            ? 'primary.main'
            : isSystem
              ? 'action.selected'
              : 'background.default',
          color: isAdmin ? '#fff' : 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1.5,
          border: isSystem ? '1px dashed' : 'none',
          borderColor: 'divider',
        }}
      >
        <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
          {message.body}
        </Typography>
      </Box>
    </Box>
  );
}

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
            <Chip
              label={STATUS_LABELS[ticket.status]}
              size='small'
              color={STATUS_COLORS[ticket.status]}
            />
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
      <Paper
        sx={{
          p: 2,
          mb: 2,
          maxHeight: 'calc(100vh - 420px)',
          minHeight: 200,
          overflowY: 'auto',
        }}
      >
        {ticket.messages.length === 0 ? (
          <Typography color='text.secondary' textAlign='center' py={4}>
            Aucun message
          </Typography>
        ) : (
          ticket.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
      </Paper>

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
                      {STATUS_LABELS[s]}
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
