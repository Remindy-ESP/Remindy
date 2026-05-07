import { Test, TestingModule } from '@nestjs/testing';
import { AdminMeController } from './admin-me.controller';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

describe('AdminMeController', () => {
  let controller: AdminMeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMeController],
    })
      .overrideGuard(JwtAuthGuard).useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard).useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard).useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard).useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminMeController);
  });

  describe('me()', () => {
    it('returns id, role, mfa status and permissions for SUPER_ADMIN', () => {
      const req = {
        user: {
          id: 'actor-1',
          role: Role.SUPER_ADMIN,
          mfaEnabled: true,
          mfaVerified: true,
        },
      } as any;

      const result = controller.me(req);

      expect(result.id).toBe('actor-1');
      expect(result.role).toBe(Role.SUPER_ADMIN);
      expect(result.mfaEnabled).toBe(true);
      expect(result.mfaVerified).toBe(true);
      expect(Array.isArray(result.permissions)).toBe(true);
      expect(result.permissions.length).toBeGreaterThan(0);
    });

    it('returns limited permissions for USER_ADMIN', () => {
      const req = {
        user: {
          id: 'actor-2',
          role: Role.USER_ADMIN,
          mfaEnabled: true,
          mfaVerified: true,
        },
      } as any;

      const result = controller.me(req);
      expect(result.role).toBe(Role.USER_ADMIN);
      expect(result.permissions).toContain('admin.users.read');
      expect(result.permissions).not.toContain('admin.cloud.read');
    });
  });

  describe('ping()', () => {
    it('returns ok:true', () => {
      const result = controller.ping();
      expect(result).toEqual({ ok: true });
    });
  });
});
