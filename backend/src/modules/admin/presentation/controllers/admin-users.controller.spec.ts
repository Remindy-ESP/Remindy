import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from '../../application/admin-users.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { AuditInterceptor } from 'src/modules/audit/presentation/interceptors/audit.interceptor';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  list: jest.fn(),
  getById: jest.fn(),
  ban: jest.fn(),
  unban: jest.fn(),
  verifyEmail: jest.fn(),
  forceMfa: jest.fn(),
  revokeSessions: jest.fn(),
  resetPassword: jest.fn(),
};

const makeReq = (overrides: any = {}) => ({
  user: { id: 'actor-1', role: Role.SUPER_ADMIN },
  ip: '1.2.3.4',
  get: jest.fn().mockReturnValue('test-agent'),
  ...overrides,
});

describe('AdminUsersController', () => {
  let controller: AdminUsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: AdminUsersService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(alwaysAllow)
      .overrideGuard(AdminRolesGuard).useValue(alwaysAllow)
      .overrideGuard(AdminMfaGuard).useValue(alwaysAllow)
      .overrideGuard(AdminCsrfGuard).useValue(alwaysAllow)
      .overrideInterceptor(AuditInterceptor).useValue({ intercept: (_: any, next: any) => next.handle() })
      .compile();

    controller = module.get(AdminUsersController);
  });

  describe('list()', () => {
    it('delegates to service.list with actor and query', async () => {
      const items = [{ id: 'u-1' }];
      mockService.list.mockResolvedValue({ items, total: 1 });

      const req = makeReq();
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.list(req, query);

      expect(mockService.list).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        query,
      );
      expect(result).toEqual({ items, total: 1 });
    });
  });

  describe('getById()', () => {
    it('delegates to service.getById', async () => {
      const user = { id: 'u-1', email: 'a@a.com' };
      mockService.getById.mockResolvedValue(user);

      const req = makeReq();
      const result = await controller.getById(req, 'u-1');

      expect(mockService.getById).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
      );
      expect(result).toEqual(user);
    });
  });

  describe('ban()', () => {
    it('delegates to service.ban with reason', async () => {
      mockService.ban.mockResolvedValue({ ok: true, status: UserStatus.BANNED, reason: 'spam' });

      const req = makeReq();
      const result = await controller.ban(req, 'u-1', { reason: 'spam' });

      expect(mockService.ban).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        'spam',
        expect.objectContaining({ ipAddress: '1.2.3.4', userAgent: 'test-agent' }),
      );
      expect(result).toMatchObject({ ok: true });
    });
  });

  describe('unban()', () => {
    it('delegates to service.unban', async () => {
      mockService.unban.mockResolvedValue({ ok: true, status: UserStatus.ACTIVE });

      const req = makeReq();
      const result = await controller.unban(req, 'u-1');

      expect(mockService.unban).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        expect.any(Object),
      );
      expect(result).toMatchObject({ ok: true });
    });
  });

  describe('verifyEmail()', () => {
    it('delegates to service.verifyEmail', async () => {
      mockService.verifyEmail.mockResolvedValue({ ok: true, emailVerified: true });

      const req = makeReq();
      const result = await controller.verifyEmail(req, 'u-1');

      expect(mockService.verifyEmail).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        expect.any(Object),
      );
      expect(result).toMatchObject({ ok: true, emailVerified: true });
    });
  });

  describe('forceMfa()', () => {
    it('delegates to service.forceMfa', async () => {
      mockService.forceMfa.mockResolvedValue({ ok: true, mfaEnabled: true });

      const req = makeReq();
      const result = await controller.forceMfa(req, 'u-1');

      expect(mockService.forceMfa).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        expect.any(Object),
      );
      expect(result).toMatchObject({ ok: true, mfaEnabled: true });
    });
  });

  describe('revokeSessions()', () => {
    it('delegates to service.revokeSessions', async () => {
      mockService.revokeSessions.mockResolvedValue({ ok: true });

      const req = makeReq();
      const result = await controller.revokeSessions(req, 'u-1');

      expect(mockService.revokeSessions).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        expect.any(Object),
      );
      expect(result).toEqual({ ok: true });
    });
  });

  describe('resetPassword()', () => {
    it('delegates to service.resetPassword', async () => {
      mockService.resetPassword.mockResolvedValue({ ok: true });

      const req = makeReq();
      const result = await controller.resetPassword(req, 'u-1');

      expect(mockService.resetPassword).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        expect.any(Object),
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
