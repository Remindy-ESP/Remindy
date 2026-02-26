import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminSecurityService } from './admin-security.service';
import {
  SecurityEventType,
  SecuritySeverity,
} from 'src/infrastructure/database/entities/security-log.entity';
import { BlockReason } from 'src/infrastructure/database/entities/blocked-ip.entity';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';


const mockLogsRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockBlockedIpRepo = {
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockPolicyRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};


const makeQb = (result: any = null, count = 0) => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(Array.isArray(result) ? result : result ? [result] : []),
  getManyAndCount: jest.fn().mockResolvedValue([Array.isArray(result) ? result : result ? [result] : [], count]),
  getOne: jest.fn().mockResolvedValue(result),
  getCount: jest.fn().mockResolvedValue(count),
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  orUpdate: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({}),
});


const makeService = () =>
  new AdminSecurityService(
    mockLogsRepo as any,
    mockBlockedIpRepo as any,
    mockPolicyRepo as any,
  );

const superAdmin = { id: 'actor-super', role: Role.SUPER_ADMIN };
const userAdmin  = { id: 'actor-admin', role: Role.USER_ADMIN };

const makeLog = (overrides: Partial<any> = {}) => ({
  id: 'log-1',
  eventType: SecurityEventType.LOGIN_SUCCESS,
  severity: SecuritySeverity.INFO,
  isSuspicious: false,
  createdAt: new Date(),
  userId: null,
  userEmail: null,
  ipAddress: null,
  userAgent: null,
  resource: null,
  metadata: null,
  ...overrides,
});

const makePolicy = (overrides: Partial<any> = {}) => ({
  id: 'global',
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTimeoutMinutes: 60,
  requireMfaForAdmin: true,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  rateLimitPerMinute: 100,
  autoBlockAfterRequests: 20,
  autoBlockDurationMinutes: 60,
  allowedOrigins: [],
  ...overrides,
});

const makeBlockedIp = (overrides: Partial<any> = {}) => ({
  id: 'ip-1',
  ipAddress: '1.2.3.4',
  reason: BlockReason.MANUAL,
  notes: null,
  blockedUntil: null,
  isActive: true,
  blockedBy: superAdmin.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());


describe('admin-security.policy — assertCanActOnSecurity', () => {
  const { assertCanActOnSecurity } = jest.requireActual('../domain/policies/admin-security.policy');

  it('SUPER_ADMIN peut bloquer une IP', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.SUPER_ADMIN, action: 'block-ip' })).not.toThrow();
  });

  it('SUPER_ADMIN peut débloquer une IP', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.SUPER_ADMIN, action: 'unblock-ip' })).not.toThrow();
  });

  it('SUPER_ADMIN peut modifier la politique', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.SUPER_ADMIN, action: 'update-policy' })).not.toThrow();
  });

  it('USER_ADMIN ne peut PAS bloquer une IP', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.USER_ADMIN, action: 'block-ip' })).toThrow(ForbiddenException);
  });

  it('USER_ADMIN ne peut PAS débloquer une IP', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.USER_ADMIN, action: 'unblock-ip' })).toThrow(ForbiddenException);
  });

  it('USER_ADMIN ne peut PAS modifier la politique', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.USER_ADMIN, action: 'update-policy' })).toThrow(ForbiddenException);
  });

  it('USER_ADMIN peut lire (action lecture = autorisée)', () => {
    expect(() => assertCanActOnSecurity({ actorRole: Role.USER_ADMIN, action: 'read-logs' })).not.toThrow();
  });
});


describe('AdminSecurityService — listeners @OnEvent', () => {
  it('onLoginSuccess enregistre LOGIN_SUCCESS avec severity INFO', async () => {
    const log = makeLog({ eventType: SecurityEventType.LOGIN_SUCCESS });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onLoginSuccess({
      userId: 'u-1', userEmail: 'a@a.com', ipAddress: '1.1.1.1', userAgent: 'curl',
    });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.LOGIN_SUCCESS,
        severity: SecuritySeverity.INFO,
        isSuspicious: false,
      }),
    );
  });

  it('onLoginFailure enregistre LOGIN_FAILURE avec severity WARNING', async () => {
    const log = makeLog({ eventType: SecurityEventType.LOGIN_FAILURE, severity: SecuritySeverity.WARNING });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onLoginFailure({
      userEmail: 'a@a.com', ipAddress: '1.1.1.1', userAgent: 'curl',
      metadata: { reason: 'invalid_password' },
    });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.LOGIN_FAILURE,
        severity: SecuritySeverity.WARNING,
      }),
    );
  });

  it('onBruteForce enregistre LOGIN_BRUTE_FORCE avec severity CRITICAL et isSuspicious = true', async () => {
    const log = makeLog({
      eventType: SecurityEventType.LOGIN_BRUTE_FORCE,
      severity: SecuritySeverity.CRITICAL,
      isSuspicious: true,
    });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);
    mockPolicyRepo.findOne.mockResolvedValue(makePolicy());

    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);
    mockBlockedIpRepo.findOneOrFail.mockResolvedValue(makeBlockedIp());

    await makeService().onBruteForce({
      userEmail: 'a@a.com', ipAddress: '9.9.9.9', metadata: { attempts: 5 },
    });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.LOGIN_BRUTE_FORCE,
        severity: SecuritySeverity.CRITICAL,
        isSuspicious: true,
      }),
    );
  });

  it('onBruteForce déclenche un auto-blocage IP', async () => {
    const log = makeLog({ eventType: SecurityEventType.LOGIN_BRUTE_FORCE });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);
    mockPolicyRepo.findOne.mockResolvedValue(makePolicy({ autoBlockDurationMinutes: 30 }));

    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);
    mockBlockedIpRepo.findOneOrFail.mockResolvedValue(makeBlockedIp());

    await makeService().onBruteForce({ userEmail: 'a@a.com', ipAddress: '9.9.9.9' });

    expect(qb.execute).toHaveBeenCalled();
  });

  it("onBruteForce sans ipAddress ne déclenche pas d'auto-blocage", async () => {
    const log = makeLog({ eventType: SecurityEventType.LOGIN_BRUTE_FORCE });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onBruteForce({ userEmail: 'a@a.com', ipAddress: undefined as any });

    expect(mockBlockedIpRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('onLogout enregistre LOGOUT avec severity INFO', async () => {
    const log = makeLog({ eventType: SecurityEventType.LOGOUT });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onLogout({ userId: 'u-1', ipAddress: '1.1.1.1' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: SecurityEventType.LOGOUT, severity: SecuritySeverity.INFO }),
    );
  });

  it('onPasswordReset enregistre PASSWORD_RESET', async () => {
    const log = makeLog({ eventType: SecurityEventType.PASSWORD_RESET });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onPasswordReset({ userEmail: 'a@a.com' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: SecurityEventType.PASSWORD_RESET }),
    );
  });

  it('onUserBanned enregistre ADMIN_USER_BANNED avec severity WARNING', async () => {
    const log = makeLog({ eventType: SecurityEventType.ADMIN_USER_BANNED, severity: SecuritySeverity.WARNING });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onUserBanned({ actorId: 'actor-1', targetUserId: 'target-1', reason: 'spam' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.ADMIN_USER_BANNED,
        userId: 'actor-1',
        metadata: { targetUserId: 'target-1', reason: 'spam' },
      }),
    );
  });

  it('onUserUnbanned enregistre ADMIN_USER_UNBANNED avec severity INFO', async () => {
    const log = makeLog({ eventType: SecurityEventType.ADMIN_USER_UNBANNED });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onUserUnbanned({ actorId: 'actor-1', targetUserId: 'target-1' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.ADMIN_USER_UNBANNED,
        metadata: { targetUserId: 'target-1' },
      }),
    );
  });

  it('onSessionRevoked enregistre ADMIN_SESSION_REVOKED avec severity WARNING', async () => {
    const log = makeLog({ eventType: SecurityEventType.ADMIN_SESSION_REVOKED, severity: SecuritySeverity.WARNING });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onSessionRevoked({ actorId: 'actor-1', targetUserId: 'target-1' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: SecurityEventType.ADMIN_SESSION_REVOKED }),
    );
  });

  it('onCsrfViolation enregistre CSRF_VIOLATION avec severity CRITICAL et isSuspicious = true', async () => {
    const log = makeLog({
      eventType: SecurityEventType.CSRF_VIOLATION,
      severity: SecuritySeverity.CRITICAL,
      isSuspicious: true,
    });
    mockLogsRepo.create.mockReturnValue(log);
    mockLogsRepo.save.mockResolvedValue(log);

    await makeService().onCsrfViolation({ userId: 'u-1', ipAddress: '1.1.1.1', resource: 'POST /admin/test' });

    expect(mockLogsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.CSRF_VIOLATION,
        severity: SecuritySeverity.CRITICAL,
        isSuspicious: true,
      }),
    );
  });
});


describe('AdminSecurityService.getLogs()', () => {
  it('retourne les logs paginés sans filtre', async () => {
    const logs = [makeLog(), makeLog({ id: 'log-2' })];
    mockLogsRepo.createQueryBuilder.mockReturnValue(makeQb(logs, 2));

    const result = await makeService().getLogs({ page: 1, limit: 50 });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
  });

  it('applique le filtre severity', async () => {
    const qb = makeQb([], 0);
    mockLogsRepo.createQueryBuilder.mockReturnValue(qb);

    await makeService().getLogs({ severity: SecuritySeverity.CRITICAL });

    expect(qb.andWhere).toHaveBeenCalledWith('log.severity = :severity', { severity: SecuritySeverity.CRITICAL });
  });

  it('applique le filtre eventType', async () => {
    const qb = makeQb([], 0);
    mockLogsRepo.createQueryBuilder.mockReturnValue(qb);

    await makeService().getLogs({ eventType: SecurityEventType.LOGIN_FAILURE });

    expect(qb.andWhere).toHaveBeenCalledWith('log.eventType = :eventType', { eventType: SecurityEventType.LOGIN_FAILURE });
  });

  it('applique le filtre isSuspicious', async () => {
    const qb = makeQb([], 0);
    mockLogsRepo.createQueryBuilder.mockReturnValue(qb);

    await makeService().getLogs({ isSuspicious: true });

    expect(qb.andWhere).toHaveBeenCalledWith('log.isSuspicious = :s', { s: true });
  });

  it('applique les filtres from/to', async () => {
    const qb = makeQb([], 0);
    mockLogsRepo.createQueryBuilder.mockReturnValue(qb);

    await makeService().getLogs({ from: '2024-01-01T00:00:00Z', to: '2024-12-31T23:59:59Z' });

    expect(qb.andWhere).toHaveBeenCalledWith('log.createdAt >= :from', expect.objectContaining({ from: expect.any(Date) }));
    expect(qb.andWhere).toHaveBeenCalledWith('log.createdAt <= :to', expect.objectContaining({ to: expect.any(Date) }));
  });
});


describe('AdminSecurityService.getSuspiciousEvents()', () => {
  it('retourne uniquement les événements suspects', async () => {
    mockLogsRepo.findAndCount.mockResolvedValue([[makeLog({ isSuspicious: true })], 1]);

    const result = await makeService().getSuspiciousEvents(1, 50);

    expect(mockLogsRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isSuspicious: true } }),
    );
    expect(result.total).toBe(1);
  });
});


describe('AdminSecurityService.blockIp()', () => {
  const dto = { ipAddress: '1.2.3.4', reason: BlockReason.MANUAL, notes: 'test' };

  it('bloque une IP (super_admin)', async () => {
    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);
    mockBlockedIpRepo.findOneOrFail.mockResolvedValue(makeBlockedIp());

    const logEntry = makeLog({ eventType: SecurityEventType.IP_BLOCKED });
    mockLogsRepo.create.mockReturnValue(logEntry);
    mockLogsRepo.save.mockResolvedValue(logEntry);

    const result = await makeService().blockIp(superAdmin, dto);
    expect(result.ipAddress).toBe('1.2.3.4');
  });

  it('calcule blockedUntil si durationMinutes fourni', async () => {
    const before = Date.now();
    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);
    mockBlockedIpRepo.findOneOrFail.mockResolvedValue(makeBlockedIp());

    const logEntry = makeLog();
    mockLogsRepo.create.mockReturnValue(logEntry);
    mockLogsRepo.save.mockResolvedValue(logEntry);

    await makeService().blockIp(superAdmin, { ...dto, durationMinutes: 60 });

    const inserted = qb.values.mock.calls[0][0];
    expect(inserted.blockedUntil.getTime()).toBeGreaterThanOrEqual(before + 60 * 60_000 - 100);
  });

  it('blockedUntil est null si durationMinutes absent (blocage permanent)', async () => {
    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);
    mockBlockedIpRepo.findOneOrFail.mockResolvedValue(makeBlockedIp());

    const logEntry = makeLog();
    mockLogsRepo.create.mockReturnValue(logEntry);
    mockLogsRepo.save.mockResolvedValue(logEntry);

    await makeService().blockIp(superAdmin, dto);

    const inserted = qb.values.mock.calls[0][0];
    expect(inserted.blockedUntil).toBeNull();
  });

  it('lève ForbiddenException si USER_ADMIN tente de bloquer', async () => {
    await expect(makeService().blockIp(userAdmin, dto)).rejects.toThrow(ForbiddenException);
    expect(mockBlockedIpRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});


describe('AdminSecurityService.unblockIp()', () => {
  it('débloque une IP existante (super_admin)', async () => {
    mockBlockedIpRepo.findOne.mockResolvedValue(makeBlockedIp());
    mockBlockedIpRepo.update.mockResolvedValue({});

    const logEntry = makeLog({ eventType: SecurityEventType.IP_UNBLOCKED });
    mockLogsRepo.create.mockReturnValue(logEntry);
    mockLogsRepo.save.mockResolvedValue(logEntry);

    const result = await makeService().unblockIp(superAdmin, 'ip-1');

    expect(result).toEqual({ ok: true });
    expect(mockBlockedIpRepo.update).toHaveBeenCalledWith('ip-1', { isActive: false });
  });

  it('lève NotFoundException si IP introuvable', async () => {
    mockBlockedIpRepo.findOne.mockResolvedValue(null);

    await expect(makeService().unblockIp(superAdmin, 'ghost')).rejects.toThrow(NotFoundException);
    expect(mockBlockedIpRepo.update).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException si USER_ADMIN tente de débloquer', async () => {
    await expect(makeService().unblockIp(userAdmin, 'ip-1')).rejects.toThrow(ForbiddenException);
  });
});


describe('AdminSecurityService.isIpBlocked()', () => {
  it('retourne true si IP active trouvée', async () => {
    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);

    expect(await makeService().isIpBlocked('1.2.3.4')).toBe(true);
  });

  it('retourne false si IP non trouvée', async () => {
    const qb = makeQb(null);
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);

    expect(await makeService().isIpBlocked('5.5.5.5')).toBe(false);
  });
});


describe('AdminSecurityService.getPolicy()', () => {
  it('retourne la politique existante', async () => {
    mockPolicyRepo.findOne.mockResolvedValue(makePolicy());

    const result = await makeService().getPolicy();
    expect(result.id).toBe('global');
  });

  it("crée la politique si elle n'existe pas encore", async () => {
    mockPolicyRepo.findOne.mockResolvedValue(null);
    const created = makePolicy();
    mockPolicyRepo.create.mockReturnValue(created);
    mockPolicyRepo.save.mockResolvedValue(created);

    const result = await makeService().getPolicy();
    expect(mockPolicyRepo.save).toHaveBeenCalled();
    expect(result.id).toBe('global');
  });
});

describe('AdminSecurityService.updatePolicy()', () => {
  it('met à jour la politique (super_admin)', async () => {
    mockPolicyRepo.findOne.mockResolvedValue(makePolicy());
    mockPolicyRepo.save.mockResolvedValue({ ...makePolicy(), maxLoginAttempts: 10 });

    const result = await makeService().updatePolicy(superAdmin, { maxLoginAttempts: 10 });
    expect(result.maxLoginAttempts).toBe(10);
  });

  it('lève ForbiddenException si USER_ADMIN tente de modifier', async () => {
    await expect(makeService().updatePolicy(userAdmin, { maxLoginAttempts: 3 }))
      .rejects.toThrow(ForbiddenException);
    expect(mockPolicyRepo.save).not.toHaveBeenCalled();
  });
});


describe('AdminSecurityService.getSecurityStats()', () => {
  it('retourne les KPIs de sécurité', async () => {
    mockLogsRepo.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7);

    const qb = makeQb([], 2);
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await makeService().getSecurityStats();

    expect(result).toEqual({
      criticalEventsLast24h: 3,
      suspiciousEventsLast24h: 7,
      activeBlockedIps: 2,
    });
  });
});


describe('AdminSecurityService.getIpActivity()', () => {
  it('retourne les logs récents et le statut de blocage', async () => {
    const logs = [makeLog({ ipAddress: '1.2.3.4' })];
    mockLogsRepo.find.mockResolvedValue(logs);

    const qb = makeQb(makeBlockedIp());
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await makeService().getIpActivity('1.2.3.4');

    expect(result.ipAddress).toBe('1.2.3.4');
    expect(result.isBlocked).toBe(true);
    expect(result.recentLogs).toHaveLength(1);
  });

  it("retourne isBlocked = false si l'IP n'est pas bloquée", async () => {
    mockLogsRepo.find.mockResolvedValue([]);

    const qb = makeQb(null);
    mockBlockedIpRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await makeService().getIpActivity('9.9.9.9');

    expect(result.isBlocked).toBe(false);
    expect(result.recentLogs).toHaveLength(0);
  });
});