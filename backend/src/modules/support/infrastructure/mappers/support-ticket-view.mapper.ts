import {
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';

export interface PersonView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

type PersonLike = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/** Maps a user/admin relation to the public person summary, or null when absent. */
export function mapPerson(person?: PersonLike | null): PersonView | null {
  return person
    ? {
        id: person.id,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
      }
    : null;
}

/** Maps the scalar ticket fields shared by every ticket view (admin + user). */
export function mapTicketBase(ticket: SupportTicketEntity) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    lastReplyAt: ticket.lastReplyAt,
    closedAt: ticket.closedAt,
    assignedAdmin: mapPerson(ticket.assignedAdmin),
  };
}

/** Maps a ticket message, resolving its author according to the author type. */
export function mapTicketMessage(message: SupportTicketMessageEntity) {
  return {
    id: message.id,
    authorType: message.authorType,
    body: message.body,
    createdAt: message.createdAt,
    author:
      message.authorType === SupportTicketAuthorType.USER
        ? mapPerson(message.authorUser)
        : message.authorType === SupportTicketAuthorType.ADMIN
          ? mapPerson(message.authorAdmin)
          : null,
  };
}
