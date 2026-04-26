import { SupportController } from './support.controller';
import { CreateSupportTicketUseCase } from '../../application/use-cases/create-support-ticket.use-case';
import { ListMySupportTicketsUseCase } from '../../application/use-cases/list-my-support-tickets.use-case';
import { GetMySupportTicketByIdUseCase } from '../../application/use-cases/get-my-support-ticket-by-id.use-case';
import { ReplyToMySupportTicketUseCase } from '../../application/use-cases/reply-to-my-support-ticket.use-case';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

describe('SupportController', () => {
  let controller: SupportController;

  let createSupportTicketUseCase: jest.Mocked<Partial<CreateSupportTicketUseCase>>;
  let listMySupportTicketsUseCase: jest.Mocked<Partial<ListMySupportTicketsUseCase>>;
  let getMySupportTicketByIdUseCase: jest.Mocked<Partial<GetMySupportTicketByIdUseCase>>;
  let replyToMySupportTicketUseCase: jest.Mocked<Partial<ReplyToMySupportTicketUseCase>>;

  beforeEach(() => {
    createSupportTicketUseCase = { execute: jest.fn() };
    listMySupportTicketsUseCase = { execute: jest.fn() };
    getMySupportTicketByIdUseCase = { execute: jest.fn() };
    replyToMySupportTicketUseCase = { execute: jest.fn() };

    controller = new SupportController(
      createSupportTicketUseCase as CreateSupportTicketUseCase,
      listMySupportTicketsUseCase as ListMySupportTicketsUseCase,
      getMySupportTicketByIdUseCase as GetMySupportTicketByIdUseCase,
      replyToMySupportTicketUseCase as ReplyToMySupportTicketUseCase,
    );
  });

  it('should return all support ticket categories', () => {
    const result = controller.getCategories();

    expect(result).toEqual(Object.values(SupportTicketCategory));
  });

  it('should delegate ticket creation to createSupportTicketUseCase', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const dto = {
      subject: 'Facture',
      message: 'Question sur ma facture',
      category: SupportTicketCategory.BILLING,
    };

    (createSupportTicketUseCase.execute as jest.Mock).mockResolvedValue({ id: 'ticket-1' });

    const result = await controller.create(req, dto);

    expect(createSupportTicketUseCase.execute).toHaveBeenCalledWith({ id: 'user-1' }, dto);
    expect(result).toEqual({ id: 'ticket-1' });
  });

  it('should delegate listing to listMySupportTicketsUseCase', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const query = { page: 1, limit: 20 };

    (listMySupportTicketsUseCase.execute as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    const result = await controller.listMine(req, query);

    expect(listMySupportTicketsUseCase.execute).toHaveBeenCalledWith({ id: 'user-1' }, query);
    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  });

  it('should delegate get by id to getMySupportTicketByIdUseCase', async () => {
    const req = { user: { id: 'user-1' } } as any;

    (getMySupportTicketByIdUseCase.execute as jest.Mock).mockResolvedValue({
      id: 'ticket-1',
    });

    const result = await controller.getMineById(req, 'ticket-1');

    expect(getMySupportTicketByIdUseCase.execute).toHaveBeenCalledWith(
      { id: 'user-1' },
      'ticket-1',
    );
    expect(result).toEqual({ id: 'ticket-1' });
  });

  it('should delegate reply to replyToMySupportTicketUseCase', async () => {
    const req = { user: { id: 'user-1' } } as any;
    const dto = { message: 'Merci' };

    (replyToMySupportTicketUseCase.execute as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const result = await controller.reply(req, 'ticket-1', dto);

    expect(replyToMySupportTicketUseCase.execute).toHaveBeenCalledWith(
      { id: 'user-1' },
      'ticket-1',
      dto,
    );
    expect(result).toEqual({ ok: true });
  });
});
