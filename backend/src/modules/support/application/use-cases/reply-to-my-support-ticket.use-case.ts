import { Injectable, NotFoundException } from '@nestjs/common';
import { ReplySupportTicketDto } from '../dto/reply-support-ticket.dto';
import { SupportUserActor } from '../../domain/types/support-user-actor.type';
import { SupportTicketPolicy } from '../../domain/policies/support-ticket.policy';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';
import { SupportTicketWriteRepository } from '../../infrastructure/repositories/support-ticket-write.repository';

@Injectable()
export class ReplyToMySupportTicketUseCase {
  constructor(
    private readonly readRepository: SupportTicketReadRepository,
    private readonly writeRepository: SupportTicketWriteRepository,
  ) {}

  async execute(actor: SupportUserActor, ticketId: string, dto: ReplySupportTicketDto) {
    const ticket = await this.readRepository.findMineRecordById(actor.id, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    SupportTicketPolicy.assertUserCanReply(ticket.status);

    const message = await this.writeRepository.createUserMessage({
      ticketId: ticket.id,
      userId: actor.id,
      body: dto.message,
    });

    ticket.status = SupportTicketPolicy.nextStatusAfterUserReply();
    ticket.lastReplyAt = message.createdAt;
    ticket.closedAt = null;

    await this.writeRepository.saveTicket(ticket);

    return {
      ok: true,
      ticketId: ticket.id,
      status: ticket.status,
      message: {
        id: message.id,
        authorType: message.authorType,
        body: message.body,
        createdAt: message.createdAt,
      },
    };
  }
}
