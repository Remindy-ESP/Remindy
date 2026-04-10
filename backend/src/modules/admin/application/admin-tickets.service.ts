import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  EUser,
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { AdminTicketsQueryDto } from '../presentation/dto/admin-tickets-query.dto';
import { AdminReplyTicketDto } from '../presentation/dto/admin-reply-ticket.dto';
import { SupportTicketAuthorType } from 'src/modules/support/domain/enums/support-ticket-author-type.enum';
import { AdminTicketsPolicy } from '../domain/policies/admin-tickets.policy';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';

@Injectable()
export class AdminTicketsService {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepo: Repository<SupportTicketEntity>,
    @InjectRepository(SupportTicketMessageEntity)
    private readonly messagesRepo: Repository<SupportTicketMessageEntity>,
    @InjectRepository(EUser)
    private readonly usersRepo: Repository<EUser>,
  ) {}

  async listTickets(query: AdminTicketsQueryDto) {
    const qb = this.ticketsRepo
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.assignedAdmin', 'assignedAdmin');

    if (query.q) {
      const q = `%${query.q.trim()}%`;
      const parts = query.q.trim().split(/\s+/);

      qb.andWhere(
        new Brackets(b => {
          b.where('ticket.subject ILIKE :q', { q }).orWhere('user.email ILIKE :q', { q });

          if (parts.length >= 2) {
            b.orWhere('(user.firstName ILIKE :first AND user.lastName ILIKE :last)', {
              first: `%${parts[0]}%`,
              last: `%${parts[parts.length - 1]}%`,
            }).orWhere('(user.firstName ILIKE :last AND user.lastName ILIKE :first)', {
              first: `%${parts[0]}%`,
              last: `%${parts[parts.length - 1]}%`,
            });
          } else {
            b.orWhere('user.firstName ILIKE :q', { q }).orWhere('user.lastName ILIKE :q', { q });
          }
        }),
      );
    }

    if (query.status) {
      qb.andWhere('ticket.status = :status', { status: query.status });
    }

    if (query.category) {
      qb.andWhere('ticket.category = :category', { category: query.category });
    }

    if (query.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: query.priority });
    }

    const sortColumnMap: Record<AdminTicketsQueryDto['sortBy'], string> = {
      createdAt: 'ticket.createdAt',
      updatedAt: 'ticket.updatedAt',
      lastReplyAt: 'ticket.lastReplyAt',
      priority: 'ticket.priority',
      status: 'ticket.status',
    };

    qb.orderBy(sortColumnMap[query.sortBy], query.sortDir, 'NULLS LAST');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

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
        user: ticket.user
          ? {
              id: ticket.user.id,
              email: ticket.user.email,
              firstName: ticket.user.firstName,
              lastName: ticket.user.lastName,
            }
          : null,
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

  async getTicketById(id: string) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: {
        user: true,
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
      throw new NotFoundException('Support ticket not found');
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
      user: ticket.user
        ? {
            id: ticket.user.id,
            email: ticket.user.email,
            firstName: ticket.user.firstName,
            lastName: ticket.user.lastName,
          }
        : null,
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

  async replyToTicket(adminId: string, ticketId: string, dto: AdminReplyTicketDto) {
    const ticket = await this.ticketsRepo.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    AdminTicketsPolicy.assertReplyAllowed(ticket.status);

    const nextStatus = AdminTicketsPolicy.resolveNextStatus(dto.status);
    const now = new Date();

    const messageToSave = this.messagesRepo.create({
      ticketId: ticket.id,
      authorType: SupportTicketAuthorType.ADMIN,
      authorAdminId: adminId,
      authorUserId: null,
      body: dto.message.trim(),
    });

    const savedMessage = await this.messagesRepo.save(messageToSave);

    ticket.status = nextStatus;
    ticket.lastReplyAt = now;
    ticket.closedAt = nextStatus === SupportTicketStatus.CLOSED ? now : null;

    await this.ticketsRepo.save(ticket);

    const adminUser = await this.usersRepo.findOne({
      where: { id: adminId },
      select: ['id', 'email', 'firstName', 'lastName'],
    });

    return {
      ok: true,
      ticketId: ticket.id,
      status: ticket.status,
      message: {
        id: savedMessage.id,
        authorType: savedMessage.authorType,
        body: savedMessage.body,
        createdAt: savedMessage.createdAt,
        author: adminUser
          ? {
              id: adminUser.id,
              email: adminUser.email,
              firstName: adminUser.firstName,
              lastName: adminUser.lastName,
            }
          : null,
      },
    };
  }
}
