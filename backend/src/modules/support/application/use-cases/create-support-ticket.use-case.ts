import { Injectable } from '@nestjs/common';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportUserActor } from '../../domain/types/support-user-actor.type';
import { SupportTicketPolicy } from '../../domain/policies/support-ticket.policy';
import { SupportTicketWriteRepository } from '../../infrastructure/repositories/support-ticket-write.repository';

@Injectable()
export class CreateSupportTicketUseCase {
  constructor(private readonly writeRepository: SupportTicketWriteRepository) {}

  async execute(actor: SupportUserActor, dto: CreateSupportTicketDto) {
    const ticket = await this.writeRepository.createTicket({
      userId: actor.id,
      subject: dto.subject,
      category: dto.category,
    });

    const message = await this.writeRepository.createUserMessage({
      ticketId: ticket.id,
      userId: actor.id,
      body: dto.message,
    });

    ticket.status = SupportTicketPolicy.initialStatus();
    ticket.lastReplyAt = message.createdAt;

    await this.writeRepository.saveTicket(ticket);

    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastReplyAt: ticket.lastReplyAt,
      message: {
        id: message.id,
        authorType: message.authorType,
        body: message.body,
        createdAt: message.createdAt,
      },
    };
  }
}
