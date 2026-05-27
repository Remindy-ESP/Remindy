import type { SupportTicketStatus } from './support.service';

export const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'Ouvert',
  pending_user: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export const STATUS_COLORS: Record<SupportTicketStatus, string> = {
  open: '#E8A838',
  pending_user: '#4B9BE8',
  resolved: '#4CAF82',
  closed: '#6B6E8A',
};
