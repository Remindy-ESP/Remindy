import { Test, TestingModule } from '@nestjs/testing';
import { AdminSecurityController } from './admin-security.controller';
import { AdminSecurityService } from '../../application/admin-security.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminMfaGuard } from '../guards/admin-mfa.guard';
import { AdminCsrfGuard } from '../guards/admin-csrf.guard';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { BlockReason } from 'src/infrastructure/database/entities/blocked-ip.entity';

const alwaysAllow = { canActivate: () => true };

const mockService = {
  getLogs: jest.fn(),
  getSuspiciousEvents: jest.fn(),
  getBlockedIps: jest.fn(),
  blockIp: jest.fn(),
  unblockIp: jest.fn(),
  getIpActivity: jest.fn(),
  getPolicy: jest.fn(),
  updatePolicy: jest.fn(),
  getSecurityStats: jest.fn(),
};

const makeReq = () => ({ user: { id: 'actor-1', role: Role.SUPER_ADMIN } });

describe('AdminSecurityController', () => {
  let controller: AdminSecurityController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSecurityController],
      providers: [{ provide: AdminSecurityService, useValue: mockService }],
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

    controller = module.get(AdminSecurityController);
  });

  describe('getLogs()', () => {
    it('delegates to service.getLogs', async () => {
      const data = { items: [], total: 0, page: 1, limit: 50 };
      mockService.getLogs.mockResolvedValue(data);

      const query = {} as any;
      const result = await controller.getLogs(query);

      expect(mockService.getLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(data);
    });
  });

  describe('getSuspiciousEvents()', () => {
    it('delegates to service.getSuspiciousEvents with numeric page/limit', async () => {
      const data = { items: [], total: 0, page: 1, limit: 50 };
      mockService.getSuspiciousEvents.mockResolvedValue(data);

      const result = await controller.getSuspiciousEvents('2', '25');

      expect(mockService.getSuspiciousEvents).toHaveBeenCalledWith(2, 25);
      expect(result).toEqual(data);
    });

    it('uses default values when page/limit not provided', async () => {
      mockService.getSuspiciousEvents.mockResolvedValue({});

      await controller.getSuspiciousEvents(1, 50);
      expect(mockService.getSuspiciousEvents).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('getBlockedIps()', () => {
    it('returns only active IPs by default (all=undefined)', async () => {
      mockService.getBlockedIps.mockResolvedValue([]);

      await controller.getBlockedIps(undefined);
      expect(mockService.getBlockedIps).toHaveBeenCalledWith(true);
    });

    it('returns all IPs when all=true is passed', async () => {
      mockService.getBlockedIps.mockResolvedValue([]);

      await controller.getBlockedIps('true');
      expect(mockService.getBlockedIps).toHaveBeenCalledWith(false);
    });

    it('returns only active IPs when all=false', async () => {
      mockService.getBlockedIps.mockResolvedValue([]);

      await controller.getBlockedIps('false');
      expect(mockService.getBlockedIps).toHaveBeenCalledWith(true);
    });
  });

  describe('blockIp()', () => {
    it('delegates to service.blockIp with actor and dto', async () => {
      const entry = { id: 'ip-1', ipAddress: '1.2.3.4' };
      mockService.blockIp.mockResolvedValue(entry);

      const dto = { ipAddress: '1.2.3.4', reason: BlockReason.MANUAL } as any;
      const result = await controller.blockIp(makeReq() as any, dto);

      expect(mockService.blockIp).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        dto,
      );
      expect(result).toEqual(entry);
    });
  });

  describe('unblockIp()', () => {
    it('delegates to service.unblockIp with actor and id', async () => {
      mockService.unblockIp.mockResolvedValue({ ok: true });

      const result = await controller.unblockIp(makeReq() as any, 'ip-1');

      expect(mockService.unblockIp).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        'ip-1',
      );
      expect(result).toEqual({ ok: true });
    });
  });

  describe('getIpActivity()', () => {
    it('delegates to service.getIpActivity with ip', async () => {
      const data = { ipAddress: '1.2.3.4', isBlocked: false, recentLogs: [] };
      mockService.getIpActivity.mockResolvedValue(data);

      const result = await controller.getIpActivity('1.2.3.4');
      expect(mockService.getIpActivity).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual(data);
    });
  });

  describe('getPolicy()', () => {
    it('delegates to service.getPolicy', async () => {
      const policy = { id: 'global', maxLoginAttempts: 5 };
      mockService.getPolicy.mockResolvedValue(policy);

      const result = await controller.getPolicy();
      expect(mockService.getPolicy).toHaveBeenCalled();
      expect(result).toEqual(policy);
    });
  });

  describe('updatePolicy()', () => {
    it('delegates to service.updatePolicy with actor and dto', async () => {
      const policy = { id: 'global', maxLoginAttempts: 10 };
      mockService.updatePolicy.mockResolvedValue(policy);

      const dto = { maxLoginAttempts: 10 } as any;
      const result = await controller.updatePolicy(makeReq() as any, dto);

      expect(mockService.updatePolicy).toHaveBeenCalledWith(
        { id: 'actor-1', role: Role.SUPER_ADMIN },
        dto,
      );
      expect(result).toEqual(policy);
    });
  });

  describe('getStats()', () => {
    it('delegates to service.getSecurityStats', async () => {
      const stats = { criticalEventsLast24h: 3, suspiciousEventsLast24h: 5, activeBlockedIps: 2 };
      mockService.getSecurityStats.mockResolvedValue(stats);

      const result = await controller.getStats();
      expect(mockService.getSecurityStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });
});
