import { BadRequestException } from '@nestjs/common';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';

export class AdminTicketsPolicy {
  static assertReplyAllowed(status: SupportTicketStatus): void {
    if (status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Closed tickets cannot be replied to');
    }
  }

  static resolveNextStatus(inputStatus?: SupportTicketStatus): SupportTicketStatus {
    const nextStatus = inputStatus ?? SupportTicketStatus.PENDING_USER;

    if (nextStatus === SupportTicketStatus.OPEN) {
      throw new BadRequestException('Admin reply cannot set ticket status to open');
    }

    return nextStatus;
  }
}
