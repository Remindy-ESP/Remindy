import { NotFoundException } from '@nestjs/common';
import { GetMySupportTicketByIdUseCase } from './get-my-support-ticket-by-id.use-case';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';

describe('GetMySupportTicketByIdUseCase', () => {
  let useCase: GetMySupportTicketByIdUseCase;
  let readRepository: jest.Mocked<Partial<SupportTicketReadRepository>>;

  beforeEach(() => {
    readRepository = {
      findMineById: jest.fn(),
    };

    useCase = new GetMySupportTicketByIdUseCase(readRepository as SupportTicketReadRepository);
  });

  it('should return a ticket when found', async () => {
    const ticket = {
      id: 'ticket-1',
      subject: 'Sujet',
      status: 'open',
      messages: [],
    };

    (readRepository.findMineById as jest.Mock).mockResolvedValue(ticket);

    const result = await useCase.execute({ id: 'user-1' }, 'ticket-1');

    expect(readRepository.findMineById).toHaveBeenCalledWith('user-1', 'ticket-1');
    expect(result).toBe(ticket);
  });

  it('should throw NotFoundException when ticket is missing', async () => {
    (readRepository.findMineById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute({ id: 'user-1' }, 'missing-ticket')).rejects.toThrow(
      new NotFoundException('Support ticket not found'),
    );
  });
});
