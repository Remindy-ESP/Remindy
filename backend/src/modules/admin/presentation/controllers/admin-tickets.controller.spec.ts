import { Test, TestingModule } from '@nestjs/testing';
import { AdminTicketsController } from './admin-tickets.controller';
import { AdminTicketsService } from '../../application/admin-tickets.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  listTickets: jest.fn(),
  getTicketById: jest.fn(),
  replyToTicket: jest.fn(),
};

describe('AdminTicketsController', () => {
  let controller: AdminTicketsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTicketsController],
      providers: [{ provide: AdminTicketsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard).useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard).useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard).useValue(alwaysAllow)
      .overrideInterceptor(AuditInterceptor).useValue({ intercept: (_: any, next: any) => next.handle() })
      .compile();

    controller = module.get(AdminTicketsController);
  });

  describe('list()', () => {
    it('delegates to service.listTickets with query', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20 };
      mockService.listTickets.mockResolvedValue(data);

      const query = { page: 1, limit: 20, sortBy: 'createdAt', sortDir: 'DESC' } as any;
      const result = await controller.list(query);

      expect(mockService.listTickets).toHaveBeenCalledWith(query);
      expect(result).toEqual(data);
    });
  });

  describe('getById()', () => {
    it('delegates to service.getTicketById with id', async () => {
      const ticket = { id: 'ticket-1', subject: 'Help' };
      mockService.getTicketById.mockResolvedValue(ticket);

      const result = await controller.getById('ticket-1');

      expect(mockService.getTicketById).toHaveBeenCalledWith('ticket-1');
      expect(result).toEqual(ticket);
    });
  });

  describe('reply()', () => {
    it('delegates to service.replyToTicket with adminId, ticketId and dto', async () => {
      const response = { ok: true, ticketId: 'ticket-1', status: 'pending_user' };
      mockService.replyToTicket.mockResolvedValue(response);

      const req = { user: { id: 'admin-1' } } as any;
      const dto = { message: 'We are investigating.', status: undefined } as any;
      const result = await controller.reply(req, 'ticket-1', dto);

      expect(mockService.replyToTicket).toHaveBeenCalledWith('admin-1', 'ticket-1', dto);
      expect(result).toEqual(response);
    });
  });
});
