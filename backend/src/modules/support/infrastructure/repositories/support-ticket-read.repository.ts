import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicketEntity } from 'src/infrastructure/database/entities';
import { MySupportTicketsQueryDto } from '../../application/dto/my-support-tickets-query.dto';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';

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
      items: rows.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        lastReplyAt: ticket.lastReplyAt,
        closedAt: ticket.closedAt,
        assignedAdmin: ticket.assignedAdmin
          ? {
              id: ticket.assignedAdmin.id,
              email: ticket.assignedAdmin.email,
              firstName: ticket.assignedAdmin.firstName,
              lastName: ticket.assignedAdmin.lastName,
            }
          : null,
      })),
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
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastReplyAt: ticket.lastReplyAt,
      closedAt: ticket.closedAt,
      assignedAdmin: ticket.assignedAdmin
        ? {
            id: ticket.assignedAdmin.id,
            email: ticket.assignedAdmin.email,
            firstName: ticket.assignedAdmin.firstName,
            lastName: ticket.assignedAdmin.lastName,
          }
        : null,
      messages: (ticket.messages ?? []).map(message => ({
        id: message.id,
        authorType: message.authorType,
        body: message.body,
        createdAt: message.createdAt,
        author:
          message.authorType === SupportTicketAuthorType.USER
            ? message.authorUser
              ? {
                  id: message.authorUser.id,
                  email: message.authorUser.email,
                  firstName: message.authorUser.firstName,
                  lastName: message.authorUser.lastName,
                }
              : null
            : message.authorType === SupportTicketAuthorType.ADMIN
              ? message.authorAdmin
                ? {
                    id: message.authorAdmin.id,
                    email: message.authorAdmin.email,
                    firstName: message.authorAdmin.firstName,
                    lastName: message.authorAdmin.lastName,
                  }
                : null
              : null,
      })),
    };
  }

  async findMineRecordById(userId: string, ticketId: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId, userId },
    });

    return ticket ?? null;
  }
}
