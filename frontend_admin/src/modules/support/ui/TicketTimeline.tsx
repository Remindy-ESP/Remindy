import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {
  SupportTicketAuthorType,
  type SupportTicketMessage,
} from '@/shared/domain/types';

function authorLabel(message: SupportTicketMessage): string {
  if (message.authorType === SupportTicketAuthorType.SYSTEM) return 'Système';
  if (message.author) {
    const fullName = [message.author.firstName, message.author.lastName]
      .filter(Boolean)
      .join(' ');
    return fullName || message.author.email;
  }
  return message.authorType === SupportTicketAuthorType.ADMIN
    ? 'Admin'
    : 'Utilisateur';
}

function MessageBubble({ message }: { message: SupportTicketMessage }) {
  const isAdmin = message.authorType === SupportTicketAuthorType.ADMIN;
  const isSystem = message.authorType === SupportTicketAuthorType.SYSTEM;

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
        {authorLabel(message)} ·{' '}
        {new Date(message.createdAt).toLocaleString('fr-FR')}
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

interface Props {
  messages: SupportTicketMessage[];
}

export function TicketTimeline({ messages }: Props) {
  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        maxHeight: 'calc(100vh - 420px)',
        minHeight: 200,
        overflowY: 'auto',
      }}
    >
      {messages.length === 0 ? (
        <Typography color='text.secondary' textAlign='center' py={4}>
          Aucun message
        </Typography>
      ) : (
        messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
      )}
    </Paper>
  );
}
