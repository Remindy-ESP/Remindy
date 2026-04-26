import { ListMySupportTicketsUseCase } from './list-my-support-tickets.use-case';
import { SupportTicketReadRepository } from '../../infrastructure/repositories/support-ticket-read.repository';
import { SupportTicketStatus } from '../../domain/enums/support-ticket-status.enum';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

describe('ListMySupportTicketsUseCase', () => {
  let useCase: ListMySupportTicketsUseCase;
  let readRepository: jest.Mocked<Partial<SupportTicketReadRepository>>;

  beforeEach(() => {
    readRepository = {
      listMine: jest.fn(),
    };

    useCase = new ListMySupportTicketsUseCase(readRepository as SupportTicketReadRepository);
  });

  it('should delegate listing to readRepository', async () => {
    const query = {
      status: SupportTicketStatus.OPEN,
      category: SupportTicketCategory.BILLING,
      page: 1,
      limit: 20,
    };

    const payload = {
      items: [{ id: 'ticket-1' }],
      total: 1,
      page: 1,
      limit: 20,
    };

    (readRepository.listMine as jest.Mock).mockResolvedValue(payload);

    const result = await useCase.execute({ id: 'user-1' }, query);

    expect(readRepository.listMine).toHaveBeenCalledWith('user-1', query);
    expect(result).toEqual(payload);
  });
});
