import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicketEntity } from 'src/infrastructure/database/entities';
import { MySupportTicketsQueryDto } from '../../application/dto/my-support-tickets-query.dto';
import { mapTicketBase, mapTicketMessage } from '../mappers/support-ticket-view.mapper';

@Injectable()
export class SupportTicketReadRepository {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepo: Repository<SupportTicketEntity>,
  ) {}

  async listMine(userId: string, query: MySupportTicketsQueryDto) {
    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignedAdmin', 'assignedAdmin')
      .where('ticket.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('ticket.category = :category', { category: query.category });
    }

    qb.orderBy('ticket.updatedAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map(ticket => mapTicketBase(ticket)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findMineById(userId: string, ticketId: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId, userId },
      relations: {
        assignedAdmin: true,
        messages: {
          authorUser: true,
          authorAdmin: true,
        },
      },
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });

    if (!ticket) {
      return null;
    }

    return {
      ...mapTicketBase(ticket),
      messages: (ticket.messages ?? []).map(mapTicketMessage),
    };
  }

  async findMineRecordById(userId: string, ticketId: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId, userId },
    });

    return ticket ?? null;
  }
}
