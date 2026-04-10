import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReplyToMySupportTicketUseCase } from './reply-to-my-support-ticket.use-case';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';
import { SupportTicketWriteRepository } from '../../infrastructure/repositories/support-ticket-write.repository';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';

describe('ReplyToMySupportTicketUseCase', () => {
  let useCase: ReplyToMySupportTicketUseCase;
  let readRepository: jest.Mocked<Partial<SupportTicketReadRepository>>;
  let writeRepository: jest.Mocked<Partial<SupportTicketWriteRepository>>;

  beforeEach(() => {
    readRepository = {
      findMineRecordById: jest.fn(),
    };

    writeRepository = {
      createUserMessage: jest.fn(),
      saveTicket: jest.fn(),
    };

    useCase = new ReplyToMySupportTicketUseCase(
      readRepository as SupportTicketReadRepository,
      writeRepository as SupportTicketWriteRepository,
    );
  });

  it('should reply to an existing ticket and reopen it', async () => {
    const ticket = {
      id: 'ticket-1',
      status: SupportTicketStatus.PENDING_USER,
      lastReplyAt: null,
      closedAt: new Date('2026-04-08T09:00:00.000Z'),
    };

    const message = {
      id: 'msg-1',
      authorType: SupportTicketAuthorType.USER,
      body: 'Merci pour votre réponse',
      createdAt: new Date('2026-04-08T12:00:00.000Z'),
    };

    (readRepository.findMineRecordById as jest.Mock).mockResolvedValue(ticket);
    (writeRepository.createUserMessage as jest.Mock).mockResolvedValue(message);
    (writeRepository.saveTicket as jest.Mock).mockResolvedValue({
      ...ticket,
      status: SupportTicketStatus.OPEN,
      lastReplyAt: message.createdAt,
      closedAt: null,
    });

    const result = await useCase.execute({ id: 'user-1' }, 'ticket-1', {
      message: 'Merci pour votre réponse',
    });

    expect(readRepository.findMineRecordById).toHaveBeenCalledWith('user-1', 'ticket-1');
    expect(writeRepository.createUserMessage).toHaveBeenCalledWith({
      ticketId: 'ticket-1',
      userId: 'user-1',
      body: 'Merci pour votre réponse',
    });

    expect(writeRepository.saveTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ticket-1',
        status: SupportTicketStatus.OPEN,
        lastReplyAt: message.createdAt,
        closedAt: null,
      }),
    );

    expect(result).toEqual({
      ok: true,
      ticketId: 'ticket-1',
      status: SupportTicketStatus.OPEN,
      message: {
        id: 'msg-1',
        authorType: SupportTicketAuthorType.USER,
        body: 'Merci pour votre réponse',
        createdAt: message.createdAt,
      },
    });
  });

  it('should throw NotFoundException when ticket does not exist', async () => {
    (readRepository.findMineRecordById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'user-1' }, 'missing-ticket', { message: 'Hello' }),
    ).rejects.toThrow(new NotFoundException('Support ticket not found'));

    expect(writeRepository.createUserMessage).not.toHaveBeenCalled();
    expect(writeRepository.saveTicket).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when ticket is closed', async () => {
    const ticket = {
      id: 'ticket-1',
      status: SupportTicketStatus.CLOSED,
    };

    (readRepository.findMineRecordById as jest.Mock).mockResolvedValue(ticket);

    await expect(
      useCase.execute({ id: 'user-1' }, 'ticket-1', { message: 'Hello' }),
    ).rejects.toThrow(new BadRequestException('Closed tickets cannot be replied to'));

    expect(writeRepository.createUserMessage).not.toHaveBeenCalled();
    expect(writeRepository.saveTicket).not.toHaveBeenCalled();
  });
});
