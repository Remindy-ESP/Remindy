import { Test, TestingModule } from '@nestjs/testing';
import { AdminRbacController } from './admin-rbac.controller';
import { AdminRbacService } from '../../application/admin-rbac.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  listRoles: jest.fn(),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  addPermission: jest.fn(),
  removePermission: jest.fn(),
};

const makeReq = () => ({ user: { id: 'actor-1', role: Role.SUPER_ADMIN } });

describe('AdminRbacController', () => {
  let controller: AdminRbacController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminRbacController],
      providers: [{ provide: AdminRbacService, useValue: mockService }],
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

    controller = module.get(AdminRbacController);
  });

  describe('listRoles()', () => {
    it('delegates to service.listRoles', async () => {
      const roles = [{ key: 'user_freemium', permissions: [] }];
      mockService.listRoles.mockResolvedValue(roles);

      const result = await controller.listRoles(makeReq() as any);
      expect(mockService.listRoles).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN });
      expect(result).toEqual(roles);
    });
  });

  describe('createRole()', () => {
    it('delegates to service.createRole', async () => {
      const created = { key: 'custom', label: 'Custom', permissions: [] };
      mockService.createRole.mockResolvedValue(created);

      const body = { key: 'custom', label: 'Custom' };
      const result = await controller.createRole(makeReq() as any, body);

      expect(mockService.createRole).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN }, body);
      expect(result).toEqual(created);
    });
  });

  describe('updateRole()', () => {
    it('delegates to service.updateRole', async () => {
      const updated = { key: 'custom', label: 'Updated', permissions: [] };
      mockService.updateRole.mockResolvedValue(updated);

      const body = { label: 'Updated' };
      const result = await controller.updateRole(makeReq() as any, 'custom', body);

      expect(mockService.updateRole).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'custom',
        body,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('deleteRole()', () => {
    it('delegates to service.deleteRole', async () => {
      mockService.deleteRole.mockResolvedValue({ ok: true, key: 'custom' });

      const result = await controller.deleteRole(makeReq() as any, 'custom');
      expect(mockService.deleteRole).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN }, 'custom');
      expect(result).toEqual({ ok: true, key: 'custom' });
    });
  });

  describe('addPermission()', () => {
    it('delegates to service.addPermission', async () => {
      mockService.addPermission.mockResolvedValue({
        key: 'custom',
        permissions: ['admin.users.read'],
      });

      const body = { permission: 'admin.users.read' };
      const result = await controller.addPermission(makeReq() as any, 'custom', body);

      expect(mockService.addPermission).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'custom',
        'admin.users.read',
      );
      expect(result).toMatchObject({ key: 'custom' });
    });
  });

  describe('removePermission()', () => {
    it('delegates to service.removePermission', async () => {
      mockService.removePermission.mockResolvedValue({ key: 'custom', permissions: [] });

      const body = { permission: 'admin.users.read' };
      const result = await controller.removePermission(makeReq() as any, 'custom', body);

      expect(mockService.removePermission).toHaveBeenCalledWith(
        { role: Role.SUPER_ADMIN },
        'custom',
        'admin.users.read',
      );
      expect(result).toMatchObject({ key: 'custom' });
    });
  });
});
