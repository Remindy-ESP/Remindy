import { Injectable } from '@nestjs/common';
import { MySupportTicketsQueryDto } from '../dto/my-support-tickets-query.dto';
import { SupportUserActor } from '../../domain/types/support-user-actor.type';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';

@Injectable()
export class ListMySupportTicketsUseCase {
  constructor(private readonly readRepository: SupportTicketReadRepository) {}

  async execute(actor: SupportUserActor, query: MySupportTicketsQueryDto) {
    return this.readRepository.listMine(actor.id, query);
  }
}
