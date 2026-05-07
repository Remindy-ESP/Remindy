import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from '../../application/admin-dashboard.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  getOverview: jest.fn(),
};

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [{ provide: AdminDashboardService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard)
      .useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard)
      .useValue(alwaysAllow)
      .compile();

    controller = module.get(AdminDashboardController);
  });

  describe('getOverview()', () => {
    it('delegates to service.getOverview with actor role', async () => {
      const overview = { generatedAt: new Date().toISOString(), users: {}, subscriptions: {} };
      mockService.getOverview.mockResolvedValue(overview);

      const req = { user: { id: 'actor-1', role: Role.SUPER_ADMIN } } as any;
      const result = await controller.getOverview(req);

      expect(mockService.getOverview).toHaveBeenCalledWith({ role: Role.SUPER_ADMIN });
      expect(result).toEqual(overview);
    });

    it('passes USER_ADMIN role correctly', async () => {
      mockService.getOverview.mockResolvedValue({});

      const req = { user: { id: 'actor-2', role: Role.USER_ADMIN } } as any;
      await controller.getOverview(req);

      expect(mockService.getOverview).toHaveBeenCalledWith({ role: Role.USER_ADMIN });
    });
  });
});
