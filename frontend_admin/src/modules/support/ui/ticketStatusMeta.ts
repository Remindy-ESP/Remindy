import { SupportTicketStatus } from '@/shared/domain/types';

/** Shared FR labels and MUI Chip colors for support ticket statuses. */
export const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]: 'Ouvert',
  [SupportTicketStatus.PENDING_USER]: 'En attente',
  [SupportTicketStatus.RESOLVED]: 'Résolu',
  [SupportTicketStatus.CLOSED]: 'Fermé',
};

export const STATUS_COLORS: Record<
  SupportTicketStatus,
  'warning' | 'info' | 'success' | 'default'
> = {
  [SupportTicketStatus.OPEN]: 'warning',
  [SupportTicketStatus.PENDING_USER]: 'info',
  [SupportTicketStatus.RESOLVED]: 'success',
  [SupportTicketStatus.CLOSED]: 'default',
};
