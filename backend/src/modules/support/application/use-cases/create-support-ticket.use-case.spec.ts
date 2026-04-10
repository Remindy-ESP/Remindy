import { CreateSupportTicketUseCase } from './create-support-ticket.use-case';
import { SupportTicketWriteRepository } from '../../infrastructure/repositories/support-ticket-write.repository';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../domain/enums/support-ticket-priority.enum';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

describe('CreateSupportTicketUseCase', () => {
  let useCase: CreateSupportTicketUseCase;
  let writeRepository: jest.Mocked<Partial<SupportTicketWriteRepository>>;

  beforeEach(() => {
    writeRepository = {
      createTicket: jest.fn(),
      createUserMessage: jest.fn(),
      saveTicket: jest.fn(),
    };

    useCase = new CreateSupportTicketUseCase(writeRepository as SupportTicketWriteRepository);
  });

  it('should create a support ticket and initial user message', async () => {
    const actor = { id: 'user-1' };
    const dto = {
      subject: 'Problème de facture',
      message: 'Je pense avoir été débité deux fois.',
      category: SupportTicketCategory.BILLING,
    };

    const createdTicket = {
      id: 'ticket-1',
      subject: dto.subject,
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.MEDIUM,
      category: SupportTicketCategory.BILLING,
      createdAt: new Date('2026-04-08T10:00:00.000Z'),
      updatedAt: new Date('2026-04-08T10:00:00.000Z'),
      lastReplyAt: null,
    };

    const createdMessage = {
      id: 'msg-1',
      authorType: SupportTicketAuthorType.USER,
      body: dto.message,
      createdAt: new Date('2026-04-08T10:01:00.000Z'),
    };

    (writeRepository.createTicket as jest.Mock).mockResolvedValue(createdTicket);
    (writeRepository.createUserMessage as jest.Mock).mockResolvedValue(createdMessage);
    (writeRepository.saveTicket as jest.Mock).mockResolvedValue({
      ...createdTicket,
      lastReplyAt: createdMessage.createdAt,
    });

    const result = await useCase.execute(actor, dto);

    expect(writeRepository.createTicket).toHaveBeenCalledWith({
      userId: 'user-1',
      subject: 'Problème de facture',
      category: SupportTicketCategory.BILLING,
    });

    expect(writeRepository.createUserMessage).toHaveBeenCalledWith({
      ticketId: 'ticket-1',
      userId: 'user-1',
      body: 'Je pense avoir été débité deux fois.',
    });

    expect(writeRepository.saveTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ticket-1',
        status: SupportTicketStatus.OPEN,
        lastReplyAt: createdMessage.createdAt,
      }),
    );

    expect(result).toEqual({
      id: 'ticket-1',
      subject: 'Problème de facture',
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.MEDIUM,
      category: SupportTicketCategory.BILLING,
      createdAt: createdTicket.createdAt,
      updatedAt: createdTicket.updatedAt,
      lastReplyAt: createdMessage.createdAt,
      message: {
        id: 'msg-1',
        authorType: SupportTicketAuthorType.USER,
        body: 'Je pense avoir été débité deux fois.',
        createdAt: createdMessage.createdAt,
      },
    });
  });

  it('should create a ticket with null category when category is omitted', async () => {
    const actor = { id: 'user-1' };
    const dto = {
      subject: 'Question',
      message: 'Bonjour',
    };

    const createdTicket = {
      id: 'ticket-2',
      subject: dto.subject,
      status: SupportTicketStatus.OPEN,
      priority: SupportTicketPriority.MEDIUM,
      category: null,
      createdAt: new Date('2026-04-08T11:00:00.000Z'),
      updatedAt: new Date('2026-04-08T11:00:00.000Z'),
      lastReplyAt: null,
    };

    const createdMessage = {
      id: 'msg-2',
      authorType: SupportTicketAuthorType.USER,
      body: dto.message,
      createdAt: new Date('2026-04-08T11:01:00.000Z'),
    };

    (writeRepository.createTicket as jest.Mock).mockResolvedValue(createdTicket);
    (writeRepository.createUserMessage as jest.Mock).mockResolvedValue(createdMessage);
    (writeRepository.saveTicket as jest.Mock).mockResolvedValue(createdTicket);

    const result = await useCase.execute(actor, dto);

    expect(writeRepository.createTicket).toHaveBeenCalledWith({
      userId: 'user-1',
      subject: 'Question',
      category: undefined,
    });

    expect(result.category).toBeNull();
  });
});
