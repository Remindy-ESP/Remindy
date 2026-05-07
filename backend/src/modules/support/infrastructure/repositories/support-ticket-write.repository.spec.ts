import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { SupportTicketWriteRepository } from './support-ticket-write.repository';
import {
  SupportTicketEntity,
  SupportTicketMessageEntity,
} from 'src/infrastructure/database/entities';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../domain/enums/support-ticket-priority.enum';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

describe('SupportTicketWriteRepository', () => {
  let sut: SupportTicketWriteRepository;
  let ticketsRepo: jest.Mocked<Partial<any>>;
  let messagesRepo: jest.Mocked<Partial<any>>;

  beforeEach(async () => {
    ticketsRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    messagesRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportTicketWriteRepository,
        {
          provide: getRepositoryToken(SupportTicketEntity),
          useValue: ticketsRepo,
        },
        {
          provide: getRepositoryToken(SupportTicketMessageEntity),
          useValue: messagesRepo,
        },
      ],
    }).compile();

    sut = module.get<SupportTicketWriteRepository>(SupportTicketWriteRepository);
  });

  describe('createTicket', () => {
    it('should create and save a ticket with default values', async () => {
      const ticketData = {
        id: 'ticket-1',
        userId: 'user-1',
        subject: 'Test Subject',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.MEDIUM,
        category: null,
        assignedAdminId: null,
        lastReplyAt: null,
        closedAt: null,
      };

      ticketsRepo.create!.mockReturnValue(ticketData);
      ticketsRepo.save!.mockResolvedValue(ticketData);

      const result = await sut.createTicket({ userId: 'user-1', subject: '  Test Subject  ' });

      expect(ticketsRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        subject: 'Test Subject', // trimmed
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.MEDIUM,
        category: null,
        assignedAdminId: null,
        lastReplyAt: null,
        closedAt: null,
      });
      expect(ticketsRepo.save).toHaveBeenCalledWith(ticketData);
      expect(result).toEqual(ticketData);
    });

    it('should create ticket with category when provided', async () => {
      const category = SupportTicketCategory.BILLING;
      const ticketData = {
        id: 'ticket-2',
        userId: 'user-1',
        subject: 'Billing issue',
        status: SupportTicketStatus.OPEN,
        priority: SupportTicketPriority.MEDIUM,
        category,
        assignedAdminId: null,
        lastReplyAt: null,
        closedAt: null,
      };

      ticketsRepo.create!.mockReturnValue(ticketData);
      ticketsRepo.save!.mockResolvedValue(ticketData);

      const result = await sut.createTicket({
        userId: 'user-1',
        subject: 'Billing issue',
        category,
      });

      expect(ticketsRepo.create).toHaveBeenCalledWith(expect.objectContaining({ category }));
      expect(result.category).toBe(category);
    });

    it('should use null for category when not provided', async () => {
      const ticketData = {
        id: 'ticket-3',
        userId: 'user-1',
        subject: 'No category',
        category: null,
      };

      ticketsRepo.create!.mockReturnValue(ticketData);
      ticketsRepo.save!.mockResolvedValue(ticketData);

      await sut.createTicket({ userId: 'user-1', subject: 'No category' });

      expect(ticketsRepo.create).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
    });
  });

  describe('createUserMessage', () => {
    it('should create and save a user message', async () => {
      const messageData = {
        id: 'msg-1',
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.USER,
        authorUserId: 'user-1',
        authorAdminId: null,
        body: 'Hello support!',
      };

      messagesRepo.create!.mockReturnValue(messageData);
      messagesRepo.save!.mockResolvedValue(messageData);

      const result = await sut.createUserMessage({
        ticketId: 'ticket-1',
        userId: 'user-1',
        body: '  Hello support!  ',
      });

      expect(messagesRepo.create).toHaveBeenCalledWith({
        ticketId: 'ticket-1',
        authorType: SupportTicketAuthorType.USER,
        authorUserId: 'user-1',
        authorAdminId: null,
        body: 'Hello support!', // trimmed
      });
      expect(messagesRepo.save).toHaveBeenCalledWith(messageData);
      expect(result).toEqual(messageData);
    });

    it('should trim body whitespace', async () => {
      const messageData = { id: 'msg-2', body: 'Trimmed message' };

      messagesRepo.create!.mockReturnValue(messageData);
      messagesRepo.save!.mockResolvedValue(messageData);

      await sut.createUserMessage({
        ticketId: 'ticket-1',
        userId: 'user-1',
        body: '   Trimmed message   ',
      });

      expect(messagesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Trimmed message' }),
      );
    });
  });

  describe('saveTicket', () => {
    it('should call ticketsRepo.save with the ticket entity', async () => {
      const ticket = {
        id: 'ticket-1',
        status: SupportTicketStatus.RESOLVED,
      } as any;

      ticketsRepo.save!.mockResolvedValue(ticket);

      const result = await sut.saveTicket(ticket);

      expect(ticketsRepo.save).toHaveBeenCalledWith(ticket);
      expect(result).toEqual(ticket);
    });
  });
});
