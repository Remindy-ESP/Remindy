import { Test, TestingModule } from '@nestjs/testing';
import { AdminSuperController } from './admin-super.controller';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';

const alwaysAllow = { canActivate: () => true };

describe('AdminSuperController', () => {
  let controller: AdminSuperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSuperController],
    })
      .overrideGuard(JwtAuthGuard).useValue(alwaysAllow)
      .overrideGuard(SuperAdminGuard).useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard).useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard).useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminSuperController);
  });

  describe('ping()', () => {
    it('returns ok:true and scope super_admin_only', () => {
      const result = controller.ping();
      expect(result).toEqual({ ok: true, scope: 'super_admin_only' });
    });
  });
});
