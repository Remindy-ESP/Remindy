import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../domain/enums/support-ticket-priority.enum';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

@Injectable()
export class SupportTicketWriteRepository {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepo: Repository<SupportTicketEntity>,
    @InjectRepository(SupportTicketMessageEntity)
    private readonly messagesRepo: Repository<SupportTicketMessageEntity>,
  ) {}

  async createTicket(input: { userId: string; subject: string; category?: SupportTicketCategory }) {
    const ticket = this.ticketsRepo.create({
      userId: input.userId,
      subject: input.subject.trim(),
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.MEDIUM,
      category: input.category ?? null,
      assignedAdminId: null,
      lastReplyAt: null,
      closedAt: null,
    });

    return await this.ticketsRepo.save(ticket);
  }

  async createUserMessage(input: { ticketId: string; userId: string; body: string }) {
    const message = this.messagesRepo.create({
      ticketId: input.ticketId,
      authorType: SupportTicketAuthorType.USER,
      authorUserId: input.userId,
      authorAdminId: null,
      body: input.body.trim(),
    });

    return await this.messagesRepo.save(message);
  }

  async saveTicket(ticket: SupportTicketEntity) {
    return this.ticketsRepo.save(ticket);
  }
}
