import Chip from '@mui/material/Chip';
import { SupportTicketStatus } from '@/shared/domain/types';

export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]: 'Ouvert',
  [SupportTicketStatus.PENDING_USER]: 'En attente',
  [SupportTicketStatus.RESOLVED]: 'Résolu',
  [SupportTicketStatus.CLOSED]: 'Fermé',
};

export const TICKET_STATUS_COLORS: Record<
  SupportTicketStatus,
  'warning' | 'info' | 'success' | 'default'
> = {
  [SupportTicketStatus.OPEN]: 'warning',
  [SupportTicketStatus.PENDING_USER]: 'info',
  [SupportTicketStatus.RESOLVED]: 'success',
  [SupportTicketStatus.CLOSED]: 'default',
};

interface Props {
  status: SupportTicketStatus;
  size?: 'small' | 'medium';
}

export function TicketStatusBadge({ status, size = 'small' }: Props) {
  return (
    <Chip
      label={TICKET_STATUS_LABELS[status]}
      size={size}
      color={TICKET_STATUS_COLORS[status]}
    />
  );
}
