import { ForbiddenException } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import {
  SecurityEventType,
  SecuritySeverity,
} from 'src/infrastructure/database/entities/security-log.entity';
import { AdminPermissions } from '../presentation/permissions/admin.permissions';

jest.mock('../presentation/permissions/admin-permissions.map', () => ({
  permissionsForRole: jest.fn((role: string) =>
    role === 'allowed-role' ? [AdminPermissions.DASHBOARD_READ] : [],
  ),
}));

const makeCountQb = (count: number) => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(count),
});

const makeCloudQb = (raw: any) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  setParameter: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(raw),
});

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  const mockUsersRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSubscriptionsRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockTicketsRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDocumentsRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockSecurityLogsRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockBlockedIpRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockQueueService = {
    getQueueStats: jest.fn(),
  };

  const allowedActor = { role: 'allowed-role' as Role };
  const forbiddenActor = { role: 'forbidden-role' as Role };

  const makeSubscription = (overrides: Partial<any> = {}) => ({
    amount: 10,
    frequency: 'monthly',
    status: 'active',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AdminDashboardService(
      mockUsersRepo as any,
      mockSubscriptionsRepo as any,
      mockTicketsRepo as any,
      mockDocumentsRepo as any,
      mockSecurityLogsRepo as any,
      mockBlockedIpRepo as any,
      mockQueueService as any,
    );
  });

  it('lève ForbiddenException si le rôle ne peut pas lire le dashboard', async () => {
    await expect(service.getOverview(forbiddenActor)).rejects.toThrow(ForbiddenException);
  });

  it('retourne un overview agrégé complet', async () => {
    mockUsersRepo.count
      .mockResolvedValueOnce(24)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(18)
      .mockResolvedValueOnce(12);

    mockUsersRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(1))
      .mockReturnValueOnce(makeCountQb(2))
      .mockReturnValueOnce(makeCountQb(5))
      .mockReturnValueOnce(makeCountQb(9));

    const totalSubsQb = makeCountQb(16);
    const activeSubsQb = makeCountQb(15);
    const inactiveSubsQb = makeCountQb(1);
    const expiringSubsQb = makeCountQb(2);
    const rowsQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest
        .fn()
        .mockResolvedValue([
          makeSubscription({ amount: 10, frequency: 'monthly', status: 'active' }),
          makeSubscription({ amount: 120, frequency: 'yearly', status: 'active' }),
          makeSubscription({ amount: 5, frequency: 'weekly', status: 'active' }),
          makeSubscription({ amount: 50, frequency: 'one-time', status: 'inactive' }),
        ]),
    };

    mockSubscriptionsRepo.createQueryBuilder
      .mockReturnValueOnce(totalSubsQb)
      .mockReturnValueOnce(activeSubsQb)
      .mockReturnValueOnce(inactiveSubsQb)
      .mockReturnValueOnce(expiringSubsQb)
      .mockReturnValueOnce(rowsQb);

    mockTicketsRepo.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    mockTicketsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(2))
      .mockReturnValueOnce(makeCountQb(3))
      .mockReturnValueOnce(makeCountQb(6));

    mockDocumentsRepo.createQueryBuilder.mockReturnValueOnce(
      makeCloudQb({
        total: '21',
        storage: '2887054',
        pending: '1',
        processing: '2',
        completed: '17',
        failed: '1',
        uploaded24h: '4',
      }),
    );

    mockSecurityLogsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(20))
      .mockReturnValueOnce(makeCountQb(7))
      .mockReturnValueOnce(makeCountQb(3))
      .mockReturnValueOnce(makeCountQb(4));

    mockBlockedIpRepo.createQueryBuilder.mockReturnValueOnce(makeCountQb(2));

    mockQueueService.getQueueStats.mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 20,
      failed: 3,
      delayed: 1,
    });

    const result = await service.getOverview(allowedActor);

    expect(result).toEqual({
      generatedAt: expect.any(String),
      users: {
        total: 24,
        new24h: 1,
        new7d: 2,
        new30d: 5,
        active7d: 9,
        banned: 3,
        emailVerifiedRate: 75,
        mfaEnabledRate: 50,
      },
      subscriptions: {
        total: 16,
        active: 15,
        inactive: 1,
        expiringIn7d: 2,
        estimatedMrr: 41.65,
        byFrequency: {
          monthly: 1,
          yearly: 1,
          weekly: 1,
          'one-time': 1,
        },
      },
      support: {
        open: 4,
        pendingUser: 1,
        resolved: 2,
        closed: 1,
        highPriorityOpen: 2,
        staleOver24h: 3,
        created24h: 6,
      },
      cloud: {
        totalDocuments: 21,
        totalStorageBytes: 2887054,
        totalStorageFormatted: '2.8 MB',
        ocrPending: 1,
        ocrProcessing: 2,
        ocrCompleted: 17,
        ocrFailed: 1,
        ocrFailureRate: 4.8,
        uploaded24h: 4,
      },
      security: {
        loginFailures24h: 20,
        suspicious24h: 7,
        critical24h: 3,
        csrfViolations24h: 4,
        activeBlockedIps: 2,
      },
      jobs: {
        waiting: 5,
        active: 2,
        completed: 20,
        failed: 3,
        delayed: 1,
        errorRate: 9.7,
      },
    });
  });

  it('retourne des ratios à 0 quand il n’y a aucune donnée', async () => {
    mockUsersRepo.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    mockUsersRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockSubscriptionsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

    mockTicketsRepo.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockTicketsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockDocumentsRepo.createQueryBuilder.mockReturnValueOnce(
      makeCloudQb({
        total: '0',
        storage: '0',
        pending: '0',
        processing: '0',
        completed: '0',
        failed: '0',
        uploaded24h: '0',
      }),
    );

    mockSecurityLogsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockBlockedIpRepo.createQueryBuilder.mockReturnValueOnce(makeCountQb(0));
    mockQueueService.getQueueStats.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    });

    const result = await service.getOverview(allowedActor);

    expect(result.users.emailVerifiedRate).toBe(0);
    expect(result.users.mfaEnabledRate).toBe(0);
    expect(result.subscriptions.estimatedMrr).toBe(0);
    expect(result.cloud.ocrFailureRate).toBe(0);
    expect(result.jobs.errorRate).toBe(0);
    expect(result.cloud.totalStorageFormatted).toBe('0 B');
  });

  it('calcule correctement le MRR avec yearly, monthly et weekly', async () => {
    mockUsersRepo.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    mockUsersRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(1));

    mockSubscriptionsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(3))
      .mockReturnValueOnce(makeCountQb(3))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            makeSubscription({ amount: 120, frequency: 'yearly', status: 'active' }),
            makeSubscription({ amount: 10, frequency: 'monthly', status: 'active' }),
            makeSubscription({ amount: 5, frequency: 'weekly', status: 'active' }),
          ]),
      });

    mockTicketsRepo.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockTicketsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockDocumentsRepo.createQueryBuilder.mockReturnValueOnce(
      makeCloudQb({
        total: '0',
        storage: '0',
        pending: '0',
        processing: '0',
        completed: '0',
        failed: '0',
        uploaded24h: '0',
      }),
    );

    mockSecurityLogsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockBlockedIpRepo.createQueryBuilder.mockReturnValueOnce(makeCountQb(0));
    mockQueueService.getQueueStats.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    });

    const result = await service.getOverview(allowedActor);

    expect(result.subscriptions.estimatedMrr).toBe(41.65);
    expect(result.subscriptions.byFrequency).toEqual({
      yearly: 1,
      monthly: 1,
      weekly: 1,
    });
  });

  it('interroge les repos sécurité avec les bons filtres métier', async () => {
    mockUsersRepo.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    mockUsersRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(1));

    mockSubscriptionsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

    mockTicketsRepo.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockTicketsRepo.createQueryBuilder
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0))
      .mockReturnValueOnce(makeCountQb(0));

    mockDocumentsRepo.createQueryBuilder.mockReturnValueOnce(
      makeCloudQb({
        total: '0',
        storage: '0',
        pending: '0',
        processing: '0',
        completed: '0',
        failed: '0',
        uploaded24h: '0',
      }),
    );

    const loginFailuresQb = makeCountQb(0);
    const suspiciousQb = makeCountQb(0);
    const criticalQb = makeCountQb(0);
    const csrfQb = makeCountQb(0);

    mockSecurityLogsRepo.createQueryBuilder
      .mockReturnValueOnce(loginFailuresQb)
      .mockReturnValueOnce(suspiciousQb)
      .mockReturnValueOnce(criticalQb)
      .mockReturnValueOnce(csrfQb);

    const blockedIpQb = makeCountQb(0);
    mockBlockedIpRepo.createQueryBuilder.mockReturnValueOnce(blockedIpQb);
    mockQueueService.getQueueStats.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    });

    await service.getOverview(allowedActor);

    expect(loginFailuresQb.where).toHaveBeenCalledWith('l.eventType = :eventType', {
      eventType: SecurityEventType.LOGIN_FAILURE,
    });
    expect(suspiciousQb.where).toHaveBeenCalledWith('l.isSuspicious = true');
    expect(criticalQb.where).toHaveBeenCalledWith('l.severity = :severity', {
      severity: SecuritySeverity.CRITICAL,
    });
    expect(csrfQb.where).toHaveBeenCalledWith('l.eventType = :eventType', {
      eventType: SecurityEventType.CSRF_VIOLATION,
    });
    expect(blockedIpQb.where).toHaveBeenCalledWith('ip.isActive = true');
    expect(blockedIpQb.andWhere).toHaveBeenCalledWith(
      '(ip.blockedUntil IS NULL OR ip.blockedUntil > :now)',
      expect.objectContaining({ now: expect.any(Date) }),
    );
  });
});
