import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from '../../application/admin-audit.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  list: jest.fn(),
};

describe('AdminAuditController', () => {
  let controller: AdminAuditController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuditController],
      providers: [{ provide: AdminAuditService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard).useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard).useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard).useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminAuditController);
  });

  describe('list()', () => {
    it('delegates to service.list with actor role and query', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20 };
      mockService.list.mockResolvedValue(data);

      const req = { user: { id: 'actor-1', role: Role.SUPER_ADMIN } } as any;
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.list(req, query);

      expect(mockService.list).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN }, query);
      expect(result).toEqual(data);
    });

    it('passes USER_ADMIN role correctly', async () => {
      mockService.list.mockResolvedValue({ items: [], total: 0 });

      const req = { user: { id: 'actor-2', role: Role.USER_ADMIN } } as any;
      await controller.list(req, { page: 1, limit: 20 } as any);

      expect(mockService.list).toHaveBeenCalledWith({ role: Role.USER_ADMIN }, expect.any(Object));
    });
  });
});
