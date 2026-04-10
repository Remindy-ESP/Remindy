import { BadRequestException } from '@nestjs/common';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';

export class SupportTicketPolicy {
  static initialStatus(): SupportTicketStatus {
    return SupportTicketStatus.OPEN;
  }

  static assertUserCanReply(status: SupportTicketStatus): void {
    if (status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Closed tickets cannot be replied to');
    }
  }

  static nextStatusAfterUserReply(): SupportTicketStatus {
    return SupportTicketStatus.OPEN;
  }
}
