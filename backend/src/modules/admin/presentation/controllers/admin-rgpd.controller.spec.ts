import { Test, TestingModule } from '@nestjs/testing';
import { AdminRgpdController } from './admin-rgpd.controller';
import { AdminRgpdService } from '../../application/admin-rgpd.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  requestExport: jest.fn(),
  listExports: jest.fn(),
  deleteUserData: jest.fn(),
};

const makeReq = (overrides: any = {}) => ({
  user: { id: 'actor-1', role: Role.SUPER_ADMIN },
  ip: '10.0.0.1',
  ...overrides,
});

describe('AdminRgpdController', () => {
  let controller: AdminRgpdController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRgpdController],
      providers: [{ provide: AdminRgpdService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard)
      .useValue(alwaysAllow)
      .overrideInterceptor(AuditInterceptor)
      .useValue({ intercept: (_: any, next: any) => next.handle() })
      .compile();

    controller = module.get(AdminRgpdController);
  });

  describe('requestExport()', () => {
    it('delegates to service.requestExport with actor, userId and meta', async () => {
      const exportEntry = { id: 'export-1', status: 'pending' };
      mockService.requestExport.mockResolvedValue(exportEntry);

      const req = makeReq();
      const result = await controller.requestExport(req, 'user-target-1');

      expect(mockService.requestExport).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'user-target-1',
        { ipAddress: '10.0.0.1' },
      );
      expect(result).toEqual(exportEntry);
    });
  });

  describe('listExports()', () => {
    it('delegates to service.listExports with actor and query', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20 };
      mockService.listExports.mockResolvedValue(data);

      const req = makeReq();
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.listExports(req, query);

      expect(mockService.listExports).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        query,
      );
      expect(result).toEqual(data);
    });
  });

  describe('deleteUserData()', () => {
    it('delegates to service.deleteUserData with actor, userId and meta', async () => {
      const data = { ok: true, userId: 'user-target-1', deletedAt: new Date() };
      mockService.deleteUserData.mockResolvedValue(data);

      const req = makeReq();
      const result = await controller.deleteUserData(req, 'user-target-1');

      expect(mockService.deleteUserData).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'user-target-1',
        { ipAddress: '10.0.0.1' },
      );
      expect(result).toEqual(data);
    });
  });
});
