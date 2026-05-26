import { Test, TestingModule } from '@nestjs/testing';
import { AdminCloudController } from './admin-cloud.controller';
import { AdminCloudService } from '../../application/admin-cloud.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  listSubscriptions: jest.fn(),
  updateSharedSubscription: jest.fn(),
  listDocuments: jest.fn(),
  reprocessOcr: jest.fn(),
};

const makeReq = (role = Role.SUPER_ADMIN) => ({ user: { id: 'actor-1', role } });

describe('AdminCloudController', () => {
  let controller: AdminCloudController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCloudController],
      providers: [{ provide: AdminCloudService, useValue: mockService }],
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

    controller = module.get(AdminCloudController);
  });

  describe('listSubscriptions()', () => {
    it('delegates to service.listSubscriptions', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20 };
      mockService.listSubscriptions.mockResolvedValue(data);

      const query = { page: 1, limit: 20 } as any;
      const result = await controller.listSubscriptions(makeReq() as any, query);

      expect(mockService.listSubscriptions).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN }, query);
      expect(result).toEqual(data);
    });

    it('forwards USER_ADMIN role', async () => {
      mockService.listSubscriptions.mockResolvedValue({ items: [], total: 0 });

      await controller.listSubscriptions(makeReq(Role.USER_ADMIN) as any, {} as any);

      expect(mockService.listSubscriptions).toHaveBeenCalledWith(
        { role: Role.USER_ADMIN },
        expect.any(Object),
      );
    });
  });

  describe('updateSharedSubscription()', () => {
    it('delegates to service.updateSharedSubscription', async () => {
      const updated = { id: 'sub-1', name: 'New Name' };
      mockService.updateSharedSubscription.mockResolvedValue(updated);

      const body = { name: 'New Name' } as any;
      const result = await controller.updateSharedSubscription(makeReq() as any, 'sub-1', body);

      expect(mockService.updateSharedSubscription).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'sub-1',
        body,
      );
      expect(result).toEqual(updated);
    });

    it('forwards USER_ADMIN role', async () => {
      mockService.updateSharedSubscription.mockResolvedValue({});

      await controller.updateSharedSubscription(
        makeReq(Role.USER_ADMIN) as any,
        'sub-1',
        {} as any,
      );

      expect(mockService.updateSharedSubscription).toHaveBeenCalledWith(
        { role: Role.USER_ADMIN },
        'sub-1',
        expect.any(Object),
      );
    });
  });

  describe('listDocuments()', () => {
    it('delegates to service.listDocuments', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20 };
      mockService.listDocuments.mockResolvedValue(data);

      const query = { page: 1, limit: 20 } as any;
      const result = await controller.listDocuments(makeReq() as any, query);

      expect(mockService.listDocuments).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN }, query);
      expect(result).toEqual(data);
    });

    it('forwards USER_ADMIN role', async () => {
      mockService.listDocuments.mockResolvedValue({ items: [], total: 0 });

      await controller.listDocuments(makeReq(Role.USER_ADMIN) as any, {} as any);

      expect(mockService.listDocuments).toHaveBeenCalledWith(
        { role: Role.USER_ADMIN },
        expect.any(Object),
      );
    });
  });

  describe('reprocessOcr()', () => {
    it('delegates with force=true when body.force is true', async () => {
      mockService.reprocessOcr.mockResolvedValue({ ok: true });

      const body = { force: true } as any;
      const result = await controller.reprocessOcr(makeReq() as any, 'doc-1', body);

      expect(mockService.reprocessOcr).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'doc-1',
        true,
      );
      expect(result).toEqual({ ok: true });
    });

    it('delegates with force=false when body.force is undefined', async () => {
      mockService.reprocessOcr.mockResolvedValue({ ok: true });

      await controller.reprocessOcr(makeReq() as any, 'doc-1', {} as any);

      expect(mockService.reprocessOcr).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'doc-1',
        false,
      );
    });

    it('delegates with force=false when body.force is false', async () => {
      mockService.reprocessOcr.mockResolvedValue({ ok: true });

      await controller.reprocessOcr(makeReq() as any, 'doc-1', { force: false } as any);

      expect(mockService.reprocessOcr).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'doc-1',
        false,
      );
    });

    it('forwards USER_ADMIN role', async () => {
      mockService.reprocessOcr.mockResolvedValue({ ok: true });

      await controller.reprocessOcr(makeReq(Role.USER_ADMIN) as any, 'doc-1', {
        force: true,
      } as any);

      expect(mockService.reprocessOcr).toHaveBeenCalledWith(
        { role: Role.USER_ADMIN },
        'doc-1',
        true,
      );
    });
  });
});
