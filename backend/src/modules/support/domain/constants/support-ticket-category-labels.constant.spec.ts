import { SUPPORT_TICKET_CATEGORY_LABELS } from './support-ticket-category-labels.constant';
import { SupportTicketCategory } from '../enums/support-ticket-category.enum';

describe('SUPPORT_TICKET_CATEGORY_LABELS', () => {
  it('has a label for every SupportTicketCategory value', () => {
    const categories = Object.values(SupportTicketCategory);
    categories.forEach(category => {
      expect(SUPPORT_TICKET_CATEGORY_LABELS[category]).toBeDefined();
      expect(typeof SUPPORT_TICKET_CATEGORY_LABELS[category]).toBe('string');
    });
  });

  it('returns the correct French labels', () => {
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.TECHNICAL]).toBe('Technique');
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.BILLING]).toBe('Facturation');
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.ACCOUNT]).toBe('Compte');
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.SUBSCRIPTION]).toBe('Abonnement');
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.BUG]).toBe('Bug');
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.FEATURE_REQUEST]).toBe(
      'Demande de fonctionnalité',
    );
    expect(SUPPORT_TICKET_CATEGORY_LABELS[SupportTicketCategory.OTHER]).toBe('Autre');
  });
});
