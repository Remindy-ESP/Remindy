import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminTicketsService } from './admin-tickets.service';
import {
  EUser,
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from 'src/modules/support/domain/enums/support-ticket-priority.enum';
import { SupportTicketAuthorType } from 'src/modules/support/domain/enums/support-ticket-author-type.enum';
import { AdminTicketsPolicy } from '../domain/policies/admin-tickets.policy';
import { AdminTicketsQueryDto } from '../presentation/dto/admin-tickets-query.dto';
import { AdminReplyTicketDto } from '../presentation/dto/admin-reply-ticket.dto';

describe('AdminTicketsService', () => {
  let service: AdminTicketsService;

  let ticketsRepo: jest.Mocked<Partial<Repository<SupportTicketEntity>>>;
  let messagesRepo: jest.Mocked<Partial<Repository<SupportTicketMessageEntity>>>;
  let usersRepo: jest.Mocked<Partial<Repository<EUser>>>;

  beforeEach(() => {
    ticketsRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    messagesRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    usersRepo = {
      findOne: jest.fn(),
    };

    service = new AdminTicketsService(
      ticketsRepo as Repository<SupportTicketEntity>,
      messagesRepo as Repository<SupportTicketMessageEntity>,
      usersRepo as Repository<EUser>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('listTickets', () => {
    it('should return paginated tickets', async () => {
      const createdAt = new Date('2026-04-06T10:00:00.000Z');
      const updatedAt = new Date('2026-04-06T11:00:00.000Z');
      const lastReplyAt = new Date('2026-04-06T12:00:00.000Z');

      const rows = [
        {
          id: 'ticket-1',
          subject: 'Login issue',
          status: SupportTicketStatus.OPEN,
          priority: SupportTicketPriority.HIGH,
          category: 'technical',
          createdAt,
          updatedAt,
          lastReplyAt,
          closedAt: null,
          user: {
            id: 'user-1',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          assignedAdmin: {
            id: 'admin-1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
          },
        },
      ] as SupportTicketEntity[];

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([rows, 1]),
      };

      (ticketsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const query: AdminTicketsQueryDto = {
        q: 'login',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.HIGH,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      };

      const result = await service.listTickets(query);

      expect(ticketsRepo.createQueryBuilder).toHaveBeenCalledWith('ticket');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('ticket.user', 'user');
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('ticket.assignedAdmin', 'assignedAdmin');
      expect(qb.andWhere).toHaveBeenCalledTimes(3);
      expect(qb.orderBy).toHaveBeenCalledWith('ticket.createdAt', 'DESC', 'NULLS LAST');
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);

      expect(result).toEqual({
        items: [
          {
            id: 'ticket-1',
            subject: 'Login issue',
            status: SupportTicketStatus.OPEN,
            priority: SupportTicketPriority.HIGH,
            category: 'technical',
            createdAt,
            updatedAt,
            lastReplyAt,
            closedAt: null,
            user: {
              id: 'user-1',
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
            },
            assignedAdmin: {
              id: 'admin-1',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'User',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should return paginated tickets without filters', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (ticketsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const query: AdminTicketsQueryDto = {
        page: 2,
        limit: 10,
        sortBy: 'updatedAt',
        sortDir: 'ASC',
      };

      const result = await service.listTickets(query);

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith('ticket.updatedAt', 'ASC', 'NULLS LAST');
      expect(qb.skip).toHaveBeenCalledWith(10);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: [],
        total: 0,
        page: 2,
        limit: 10,
      });
    });
  });

  describe('getTicketById', () => {
    it('should return ticket details', async () => {
      const createdAt = new Date('2026-04-06T10:00:00.000Z');
      const updatedAt = new Date('2026-04-06T11:00:00.000Z');
      const lastReplyAt = new Date('2026-04-06T12:00:00.000Z');

      const ticket = {
        id: 'ticket-1',
        subject: 'Problem with billing',
        status: SupportTicketStatus.PENDING_USER,
        priority: SupportTicketPriority.MEDIUM,
        category: 'billing',
        createdAt,
        updatedAt,
        lastReplyAt,
        closedAt: null,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        assignedAdmin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Alice',
          lastName: 'Admin',
        },
        messages: [
          {
            id: 'msg-1',
            authorType: SupportTicketAuthorType.USER,
            body: 'I have a billing issue',
            createdAt,
            authorUser: {
              id: 'user-1',
              email: 'user@example.com',
              firstName: 'Jane',
              lastName: 'Doe',
            },
            authorAdmin: null,
          },
          {
            id: 'msg-2',
            authorType: SupportTicketAuthorType.ADMIN,
            body: 'We are checking it',
            createdAt: updatedAt,
            authorUser: null,
            authorAdmin: {
              id: 'admin-1',
              email: 'admin@example.com',
              firstName: 'Alice',
              lastName: 'Admin',
            },
          },
          {
            id: 'msg-3',
            authorType: SupportTicketAuthorType.SYSTEM,
            body: 'Ticket escalated',
            createdAt: lastReplyAt,
            authorUser: null,
            authorAdmin: null,
          },
        ],
      } as unknown as SupportTicketEntity;

      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(ticket);

      const result = await service.getTicketById('ticket-1');

      expect(ticketsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
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

      expect(result).toEqual({
        id: 'ticket-1',
        subject: 'Problem with billing',
        status: SupportTicketStatus.PENDING_USER,
        priority: SupportTicketPriority.MEDIUM,
        category: 'billing',
        createdAt,
        updatedAt,
        lastReplyAt,
        closedAt: null,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        assignedAdmin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Alice',
          lastName: 'Admin',
        },
        messages: [
          {
            id: 'msg-1',
            authorType: SupportTicketAuthorType.USER,
            body: 'I have a billing issue',
            createdAt,
            author: {
              id: 'user-1',
              email: 'user@example.com',
              firstName: 'Jane',
              lastName: 'Doe',
            },
          },
          {
            id: 'msg-2',
            authorType: SupportTicketAuthorType.ADMIN,
            body: 'We are checking it',
            createdAt: updatedAt,
            author: {
              id: 'admin-1',
              email: 'admin@example.com',
              firstName: 'Alice',
              lastName: 'Admin',
            },
          },
          {
            id: 'msg-3',
            authorType: SupportTicketAuthorType.SYSTEM,
            body: 'Ticket escalated',
            createdAt: lastReplyAt,
            author: null,
          },
        ],
      });
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getTicketById('missing-ticket')).rejects.toThrow(
        new NotFoundException('Support ticket not found'),
      );
    });
  });

  describe('replyToTicket', () => {
    it('should reply to a ticket and set default status to pending_user', async () => {
      const ticket = {
        id: 'ticket-1',
        subject: 'Subject',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.MEDIUM,
        category: null,
        userId: 'user-1',
        assignedAdminId: null,
        createdAt: new Date('2026-04-06T08:00:00.000Z'),
        updatedAt: new Date('2026-04-06T08:30:00.000Z'),
        lastReplyAt: null,
        closedAt: null,
      } as SupportTicketEntity;

      const createdMessage = {
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.ADMIN,
        authorAdminId: 'admin-1',
        authorUserId: null,
        body: 'Trimmed reply',
      } as SupportTicketMessageEntity;

      const savedMessage = {
        id: 'msg-1',
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.ADMIN,
        authorAdminId: 'admin-1',
        authorUserId: null,
        body: 'Trimmed reply',
        createdAt: new Date('2026-04-06T13:00:00.000Z'),
      } as SupportTicketMessageEntity;

      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Alice',
        lastName: 'Admin',
      } as EUser;

      jest.spyOn(AdminTicketsPolicy, 'assertReplyAllowed').mockImplementation();
      jest
        .spyOn(AdminTicketsPolicy, 'resolveNextStatus')
        .mockReturnValue(SupportTicketStatus.PENDING_USER);

      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(ticket);
      (messagesRepo.create as jest.Mock).mockReturnValue(createdMessage);
      (messagesRepo.save as jest.Mock).mockResolvedValue(savedMessage);
      (ticketsRepo.save as jest.Mock).mockImplementation(async entity => await entity);
      (usersRepo.findOne as jest.Mock).mockResolvedValue(adminUser);

      const dto: AdminReplyTicketDto = {
        message: '   Trimmed reply   ',
      };

      const result = await service.replyToTicket('admin-1', 'ticket-1', dto);

      expect(ticketsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
      });

      expect(AdminTicketsPolicy.assertReplyAllowed).toHaveBeenCalledWith(SupportTicketStatus.OPEN);
      expect(AdminTicketsPolicy.resolveNextStatus).toHaveBeenCalledWith(undefined);

      expect(messagesRepo.create).toHaveBeenCalledWith({
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.ADMIN,
        authorAdminId: 'admin-1',
        authorUserId: null,
        body: 'Trimmed reply',
      });

      expect(messagesRepo.save).toHaveBeenCalledWith(createdMessage);
      expect(ticketsRepo.save).toHaveBeenCalled();

      expect(ticket.status).toBe(SupportTicketStatus.PENDING_USER);
      expect(ticket.lastReplyAt).toBeInstanceOf(Date);
      expect(ticket.closedAt).toBeNull();

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      expect(result).toEqual({
        ok: true,
        ticketId: 'ticket-1',
        status: SupportTicketStatus.PENDING_USER,
        message: {
          id: 'msg-1',
          authorType: SupportTicketAuthorType.ADMIN,
          body: 'Trimmed reply',
          createdAt: savedMessage.createdAt,
          author: {
            id: 'admin-1',
            email: 'admin@example.com',
            firstName: 'Alice',
            lastName: 'Admin',
          },
        },
      });
    });

    it('should set closedAt when status becomes closed', async () => {
      const ticket = {
        id: 'ticket-1',
        status: SupportTicketStatus.OPEN,
        closedAt: null,
      } as SupportTicketEntity;

      const savedMessage = {
        id: 'msg-1',
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.ADMIN,
        authorAdminId: 'admin-1',
        authorUserId: null,
        body: 'We are closing this ticket',
        createdAt: new Date('2026-04-06T14:00:00.000Z'),
      } as SupportTicketMessageEntity;

      jest.spyOn(AdminTicketsPolicy, 'assertReplyAllowed').mockImplementation();
      jest
        .spyOn(AdminTicketsPolicy, 'resolveNextStatus')
        .mockReturnValue(SupportTicketStatus.CLOSED);

      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(ticket);
      (messagesRepo.create as jest.Mock).mockReturnValue(savedMessage);
      (messagesRepo.save as jest.Mock).mockResolvedValue(savedMessage);
      (ticketsRepo.save as jest.Mock).mockImplementation(async entity => await entity);
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const dto: AdminReplyTicketDto = {
        message: 'We are closing this ticket',
        status: SupportTicketStatus.CLOSED,
      };

      const result = await service.replyToTicket('admin-1', 'ticket-1', dto);

      expect(ticket.status).toBe(SupportTicketStatus.CLOSED);
      expect(ticket.lastReplyAt).toBeInstanceOf(Date);
      expect(ticket.closedAt).toBeInstanceOf(Date);

      expect(result).toEqual({
        ok: true,
        ticketId: 'ticket-1',
        status: SupportTicketStatus.CLOSED,
        message: {
          id: 'msg-1',
          authorType: SupportTicketAuthorType.ADMIN,
          body: 'We are closing this ticket',
          createdAt: savedMessage.createdAt,
          author: null,
        },
      });
    });

    it('should throw NotFoundException when replying to a missing ticket', async () => {
      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(null);

      const dto: AdminReplyTicketDto = {
        message: 'Hello',
      };

      await expect(service.replyToTicket('admin-1', 'missing-ticket', dto)).rejects.toThrow(
        new NotFoundException('Support ticket not found'),
      );

      expect(messagesRepo.create).not.toHaveBeenCalled();
      expect(messagesRepo.save).not.toHaveBeenCalled();
      expect(ticketsRepo.save).not.toHaveBeenCalled();
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('should propagate policy errors', async () => {
      const ticket = {
        id: 'ticket-1',
        status: SupportTicketStatus.CLOSED,
      } as SupportTicketEntity;

      const policyError = new Error('Policy denied');

      (ticketsRepo.findOne as jest.Mock).mockResolvedValue(ticket);
      jest.spyOn(AdminTicketsPolicy, 'assertReplyAllowed').mockImplementation(() => {
        throw policyError;
      });

      const dto: AdminReplyTicketDto = {
        message: 'Hello',
      };

      await expect(service.replyToTicket('admin-1', 'ticket-1', dto)).rejects.toThrow(policyError);

      expect(messagesRepo.create).not.toHaveBeenCalled();
      expect(messagesRepo.save).not.toHaveBeenCalled();
      expect(ticketsRepo.save).not.toHaveBeenCalled();
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('listTickets — Brackets callback coverage', () => {
    const makeBracketsAwareQb = (rows: any[], total: number) => {
      const innerQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
      };
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockImplementation(function (this: any, arg: any) {
          if (arg && typeof arg === 'object' && typeof arg.whereFactory === 'function') {
            arg.whereFactory(innerQb);
          }
          return this;
        }),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([rows, total]),
        innerQb,
      };
    };

    it('invokes single-word bracket path (firstName/lastName ILIKE :q)', async () => {
      const qb = makeBracketsAwareQb([], 0);
      (ticketsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.listTickets({
        q: 'john',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      } as any);

      expect(qb.innerQb.where).toHaveBeenCalled();
      expect(qb.innerQb.orWhere).toHaveBeenCalled();
    });

    it('invokes two-word bracket path (firstName + lastName)', async () => {
      const qb = makeBracketsAwareQb([], 0);
      (ticketsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.listTickets({
        q: 'John Doe',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      } as any);

      expect(qb.innerQb.where).toHaveBeenCalled();
      expect(qb.innerQb.orWhere).toHaveBeenCalled();
    });

    it('applies category filter when provided', async () => {
      const qb = makeBracketsAwareQb([], 0);
      (ticketsRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.listTickets({
        category: 'billing' as any,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      } as any);

      expect(qb.andWhere).toHaveBeenCalledWith('ticket.category = :category', {
        category: 'billing',
      });
    });
  });
});
