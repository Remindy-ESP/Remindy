import { SupportTicketCategory } from '../enums/support-ticket-category.enum';

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  [SupportTicketCategory.TECHNICAL]: 'Technique',
  [SupportTicketCategory.BILLING]: 'Facturation',
  [SupportTicketCategory.ACCOUNT]: 'Compte',
  [SupportTicketCategory.SUBSCRIPTION]: 'Abonnement',
  [SupportTicketCategory.BUG]: 'Bug',
  [SupportTicketCategory.FEATURE_REQUEST]: 'Demande de fonctionnalité',
  [SupportTicketCategory.OTHER]: 'Autre',
};
