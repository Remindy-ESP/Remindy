import Chip from '@mui/material/Chip';
import { SupportTicketPriority } from '@/shared/domain/types';

export const TICKET_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.LOW]: 'Faible',
  [SupportTicketPriority.MEDIUM]: 'Moyen',
  [SupportTicketPriority.HIGH]: 'Élevé',
  [SupportTicketPriority.URGENT]: 'Urgent',
};

export const TICKET_PRIORITY_COLORS: Record<
  SupportTicketPriority,
  'default' | 'info' | 'warning' | 'error'
> = {
  [SupportTicketPriority.LOW]: 'default',
  [SupportTicketPriority.MEDIUM]: 'info',
  [SupportTicketPriority.HIGH]: 'warning',
  [SupportTicketPriority.URGENT]: 'error',
};

interface Props {
  priority: SupportTicketPriority;
  size?: 'small' | 'medium';
}

export function TicketPriorityBadge({ priority, size = 'small' }: Props) {
  return (
    <Chip
      label={TICKET_PRIORITY_LABELS[priority]}
      size={size}
      color={TICKET_PRIORITY_COLORS[priority]}
      variant='outlined'
    />
  );
}
