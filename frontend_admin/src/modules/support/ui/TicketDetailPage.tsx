import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAdminTicket } from '@/modules/support/application/useAdminTickets';
import { FullPageLoader, ErrorState } from '@/shared/ui/NetworkStates';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { TicketTimeline } from './TicketTimeline';
import { TicketReplyForm } from './TicketReplyForm';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError, refetch } = useAdminTicket(id!);

  if (isLoading) return <FullPageLoader />;
  if (isError || !ticket) {
    return (
      <ErrorState
        message='Impossible de charger le ticket.'
        onRetry={refetch}
      />
    );
  }

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
              <Link
                component={RouterLink}
                to={`/users/${ticket.user.id}`}
                variant='caption'
                color='primary'
                sx={{ alignSelf: 'center', fontWeight: 500 }}
              >
                {ticket.user.email}
              </Link>
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

      <TicketTimeline messages={ticket.messages} />

      <TicketReplyForm ticketId={ticket.id} ticketStatus={ticket.status} />
    </Box>
  );
}
