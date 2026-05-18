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

    it('forwards USER_ADMIN role correctly', async () => {
      mockService.list.mockResolvedValue({ items: [], total: 0 });

      const req = makeReq({ user: { id: 'actor-2', role: Role.USER_ADMIN } });
      await controller.list(req, {} as any);

      expect(mockService.list).toHaveBeenCalledWith(
        { id: 'actor-2', role: Role.USER_ADMIN },
        expect.any(Object),
      );
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

    it('forwards USER_ADMIN role correctly', async () => {
      mockService.getById.mockResolvedValue({ id: 'u-1' });

      const req = makeReq({ user: { id: 'actor-2', role: Role.USER_ADMIN } });
      await controller.getById(req, 'u-1');

      expect(mockService.getById).toHaveBeenCalledWith(
        { id: 'actor-2', role: Role.USER_ADMIN },
        'u-1',
      );
    });
  });

  describe('ban()', () => {
    it('delegates to service.ban with reason and meta', async () => {
      mockService.ban.mockResolvedValue({ ok: true, status: UserStatus.BANNED, reason: 'spam' });

      const req = makeReq();
      const result = await controller.ban(req, 'u-1', { reason: 'spam' });

      expect(mockService.ban).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        'spam',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toMatchObject({ ok: true });
    });

    it('includes ip and user-agent from request', async () => {
      mockService.ban.mockResolvedValue({ ok: true });

      const req = makeReq({
        ip: '9.9.9.9',
        get: jest.fn().mockReturnValue('custom-agent'),
      });
      await controller.ban(req, 'u-1', { reason: 'abuse' });

      expect(mockService.ban).toHaveBeenCalledWith(
        expect.any(Object),
        'u-1',
        'abuse',
        { ipAddress: '9.9.9.9', userAgent: 'custom-agent' },
      );
    });
  });

  describe('unban()', () => {
    it('delegates to service.unban with actor and meta', async () => {
      mockService.unban.mockResolvedValue({ ok: true, status: UserStatus.ACTIVE });

      const req = makeReq();
      const result = await controller.unban(req, 'u-1');

      expect(mockService.unban).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toMatchObject({ ok: true });
    });

    it('includes correct ip and user-agent from request', async () => {
      mockService.unban.mockResolvedValue({ ok: true });

      const req = makeReq({
        ip: '5.5.5.5',
        get: jest.fn().mockReturnValue('another-agent'),
      });
      await controller.unban(req, 'u-1');

      expect(mockService.unban).toHaveBeenCalledWith(
        expect.any(Object),
        'u-1',
        { ipAddress: '5.5.5.5', userAgent: 'another-agent' },
      );
    });
  });

  describe('verifyEmail()', () => {
    it('delegates to service.verifyEmail with actor and meta', async () => {
      mockService.verifyEmail.mockResolvedValue({ ok: true, emailVerified: true });

      const req = makeReq();
      const result = await controller.verifyEmail(req, 'u-1');

      expect(mockService.verifyEmail).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toMatchObject({ ok: true, emailVerified: true });
    });

    it('passes correct meta when ip or agent differs', async () => {
      mockService.verifyEmail.mockResolvedValue({ ok: true });

      const req = makeReq({ ip: '2.2.2.2', get: jest.fn().mockReturnValue('ua-x') });
      await controller.verifyEmail(req, 'u-2');

      expect(mockService.verifyEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'u-2',
        { ipAddress: '2.2.2.2', userAgent: 'ua-x' },
      );
    });
  });

  describe('forceMfa()', () => {
    it('delegates to service.forceMfa with actor and meta', async () => {
      mockService.forceMfa.mockResolvedValue({ ok: true, mfaEnabled: true });

      const req = makeReq();
      const result = await controller.forceMfa(req, 'u-1');

      expect(mockService.forceMfa).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toMatchObject({ ok: true, mfaEnabled: true });
    });

    it('passes correct meta when ip or agent differs', async () => {
      mockService.forceMfa.mockResolvedValue({ ok: true });

      const req = makeReq({ ip: '3.3.3.3', get: jest.fn().mockReturnValue('ua-y') });
      await controller.forceMfa(req, 'u-2');

      expect(mockService.forceMfa).toHaveBeenCalledWith(
        expect.any(Object),
        'u-2',
        { ipAddress: '3.3.3.3', userAgent: 'ua-y' },
      );
    });
  });

  describe('revokeSessions()', () => {
    it('delegates to service.revokeSessions with actor and meta', async () => {
      mockService.revokeSessions.mockResolvedValue({ ok: true });

      const req = makeReq();
      const result = await controller.revokeSessions(req, 'u-1');

      expect(mockService.revokeSessions).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ ok: true });
    });

    it('passes correct meta when ip or agent differs', async () => {
      mockService.revokeSessions.mockResolvedValue({ ok: true });

      const req = makeReq({ ip: '4.4.4.4', get: jest.fn().mockReturnValue('ua-z') });
      await controller.revokeSessions(req, 'u-2');

      expect(mockService.revokeSessions).toHaveBeenCalledWith(
        expect.any(Object),
        'u-2',
        { ipAddress: '4.4.4.4', userAgent: 'ua-z' },
      );
    });
  });

  describe('resetPassword()', () => {
    it('delegates to service.resetPassword with actor and meta', async () => {
      mockService.resetPassword.mockResolvedValue({ ok: true });

      const req = makeReq();
      const result = await controller.resetPassword(req, 'u-1');

      expect(mockService.resetPassword).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'u-1',
        { ipAddress: '1.2.3.4', userAgent: 'test-agent' },
      );
      expect(result).toEqual({ ok: true });
    });

    it('passes correct meta when ip or agent differs', async () => {
      mockService.resetPassword.mockResolvedValue({ ok: true });

      const req = makeReq({ ip: '6.6.6.6', get: jest.fn().mockReturnValue('ua-w') });
      await controller.resetPassword(req, 'u-2');

      expect(mockService.resetPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'u-2',
        { ipAddress: '6.6.6.6', userAgent: 'ua-w' },
      );
    });
  });
});