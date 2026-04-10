import { Injectable, NotFoundException } from '@nestjs/common';
import { SupportUserActor } from '../../domain/types/support-user-actor.type';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';

@Injectable()
export class GetMySupportTicketByIdUseCase {
  constructor(private readonly readRepository: SupportTicketReadRepository) {}

  async execute(actor: SupportUserActor, ticketId: string) {
    const ticket = await this.readRepository.findMineById(actor.id, ticketId);

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }
}
