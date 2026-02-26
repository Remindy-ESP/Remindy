import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { SecurityEventType, SecurityLogEntity, SecuritySeverity, } from 'src/infrastructure/database/entities/security-log.entity';
import { BlockedIpEntity, BlockReason, } from 'src/infrastructure/database/entities/blocked-ip.entity';
import { SecurityPolicyEntity } from 'src/infrastructure/database/entities/security-policy.entity';
import { SecurityLogsQueryDto } from '../presentation/dto/security-logs-query.dto';
import { BlockIpDto } from '../presentation/dto/block-ip.dto';
import { UpdateSecurityPolicyDto } from '../presentation/dto/update-security-policy.dto';
import { assertCanActOnSecurity } from '../domain/policies/admin-security.policy';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';

const SUSPICIOUS_EVENTS = new Set<SecurityEventType>([
  SecurityEventType.LOGIN_BRUTE_FORCE,
  SecurityEventType.CSRF_VIOLATION,
]);

const CRITICAL_EVENTS = new Set<SecurityEventType>([
  SecurityEventType.LOGIN_BRUTE_FORCE,
  SecurityEventType.CSRF_VIOLATION,
]);

const WARNING_EVENTS = new Set<SecurityEventType>([
  SecurityEventType.LOGIN_FAILURE,
  SecurityEventType.IP_BLOCKED,
  SecurityEventType.ADMIN_USER_BANNED,
  SecurityEventType.ADMIN_SESSION_REVOKED,
]);

@Injectable()
export class AdminSecurityService {
  constructor(
    @InjectRepository(SecurityLogEntity)
    private readonly logsRepo: Repository<SecurityLogEntity>,
    @InjectRepository(BlockedIpEntity)
    private readonly blockedIpRepo: Repository<BlockedIpEntity>,
    @InjectRepository(SecurityPolicyEntity)
    private readonly policyRepo: Repository<SecurityPolicyEntity>,
  ) {}


  @OnEvent('security.login.success')
  async onLoginSuccess(payload: {
    userId: string;
    userEmail: string;
    ipAddress: string;
    userAgent: string;
  }) {
    await this.record({
      eventType: SecurityEventType.LOGIN_SUCCESS,
      userId: payload.userId,
      userEmail: payload.userEmail,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  }

  @OnEvent('security.login.failure')
  async onLoginFailure(payload: {
    userEmail: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.record({
      eventType: SecurityEventType.LOGIN_FAILURE,
      userEmail: payload.userEmail,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      metadata: payload.metadata,
    });
  }

  @OnEvent('security.login.brute_force')
  async onBruteForce(payload: {
    userEmail: string;
    ipAddress: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.record({
      eventType: SecurityEventType.LOGIN_BRUTE_FORCE,
      userEmail: payload.userEmail,
      ipAddress: payload.ipAddress,
      metadata: payload.metadata,
    });
  }

  @OnEvent('security.logout')
  async onLogout(payload: { userId: string; ipAddress?: string; userAgent?: string }) {
    await this.record({
      eventType: SecurityEventType.LOGOUT,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  }

  @OnEvent('security.password.reset')
  async onPasswordReset(payload: { userEmail: string }) {
    await this.record({
      eventType: SecurityEventType.PASSWORD_RESET,
      userEmail: payload.userEmail,
    });
  }

  @OnEvent('security.admin.user.banned')
  async onUserBanned(payload: { actorId: string; targetUserId: string; reason?: string }) {
    await this.record({
      eventType: SecurityEventType.ADMIN_USER_BANNED,
      userId: payload.actorId,
      metadata: { targetUserId: payload.targetUserId, reason: payload.reason },
    });
  }

  @OnEvent('security.admin.user.unbanned')
  async onUserUnbanned(payload: { actorId: string; targetUserId: string }) {
    await this.record({
      eventType: SecurityEventType.ADMIN_USER_UNBANNED,
      userId: payload.actorId,
      metadata: { targetUserId: payload.targetUserId },
    });
  }

  @OnEvent('security.admin.session.revoked')
  async onSessionRevoked(payload: { actorId: string; targetUserId: string }) {
    await this.record({
      eventType: SecurityEventType.ADMIN_SESSION_REVOKED,
      userId: payload.actorId,
      metadata: { targetUserId: payload.targetUserId },
    });
  }

  @OnEvent('security.csrf.violation')
  async onCsrfViolation(payload: { userId?: string; ipAddress?: string; resource?: string }) {
    await this.record({
      eventType: SecurityEventType.CSRF_VIOLATION,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
      resource: payload.resource,
    });
  }


  async getLogs(query: SecurityLogsQueryDto) {
    const { page = 1, limit = 50, from, to, ...filters } = query;

    const qb = this.logsRepo.createQueryBuilder('log');

    if (filters.eventType) qb.andWhere('log.eventType = :eventType', { eventType: filters.eventType });
    if (filters.severity)  qb.andWhere('log.severity = :severity', { severity: filters.severity });
    if (filters.userId)    qb.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters.ipAddress) qb.andWhere('log.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
    if (filters.isSuspicious !== undefined) {
      qb.andWhere('log.isSuspicious = :s', { s: filters.isSuspicious });
    }
    if (from) qb.andWhere('log.createdAt >= :from', { from: new Date(from) });
    if (to)   qb.andWhere('log.createdAt <= :to', { to: new Date(to) });

    qb.orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getSuspiciousEvents(page = 1, limit = 50) {
    const [items, total] = await this.logsRepo.findAndCount({
      where: { isSuspicious: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async record(data: {
    eventType: SecurityEventType;
    severity?: SecuritySeverity;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SecurityLogEntity> {
    const severity = data.severity ?? this.resolveSeverity(data.eventType);
    const isSuspicious = SUSPICIOUS_EVENTS.has(data.eventType);

    const log = this.logsRepo.create({ ...data, severity, isSuspicious });
    const saved = await this.logsRepo.save(log);

    if (data.eventType === SecurityEventType.LOGIN_BRUTE_FORCE && data.ipAddress) {
      const policy = await this.getPolicy();
      const blockedUntil = new Date(Date.now() + policy.autoBlockDurationMinutes * 60_000);
      await this.upsertBlock({
        ipAddress: data.ipAddress,
        reason: BlockReason.BRUTE_FORCE,
        notes: 'Auto-blocage suite à brute force',
        blockedUntil,
        blockedBy: null,
      });
    }

    return saved;
  }


  async getBlockedIps(onlyActive = true) {
    const now = new Date();
    const qb = this.blockedIpRepo.createQueryBuilder('ip');

    if (onlyActive) {
      qb.where('ip.isActive = true').andWhere(
        '(ip.blockedUntil IS NULL OR ip.blockedUntil > :now)',
        { now },
      );
    }

    return qb.orderBy('ip.createdAt', 'DESC').getMany();
  }

  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const now = new Date();
    const entry = await this.blockedIpRepo
      .createQueryBuilder('ip')
      .where('ip.ipAddress = :ipAddress', { ipAddress })
      .andWhere('ip.isActive = true')
      .andWhere('(ip.blockedUntil IS NULL OR ip.blockedUntil > :now)', { now })
      .getOne();
    return !!entry;
  }

  async blockIp(actor: { id: string; role: Role }, dto: BlockIpDto) {
    assertCanActOnSecurity({ actorRole: actor.role, action: 'block-ip' });

    const blockedUntil = dto.durationMinutes
      ? new Date(Date.now() + dto.durationMinutes * 60_000)
      : null;

    const entry = await this.upsertBlock({
      ipAddress: dto.ipAddress,
      reason: dto.reason,
      notes: dto.notes ?? null,
      blockedUntil,
      blockedBy: actor.id,
    });

    await this.record({
      eventType: SecurityEventType.IP_BLOCKED,
      severity: SecuritySeverity.WARNING,
      userId: actor.id,
      ipAddress: dto.ipAddress,
      metadata: { reason: dto.reason, blockedUntil },
    });

    return entry;
  }

  async unblockIp(actor: { id: string; role: Role }, id: string) {
    assertCanActOnSecurity({ actorRole: actor.role, action: 'unblock-ip' });

    const entry = await this.blockedIpRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('IP bloquée introuvable');

    await this.blockedIpRepo.update(id, { isActive: false });

    await this.record({
      eventType: SecurityEventType.IP_UNBLOCKED,
      userId: actor.id,
      metadata: { unblockedIp: entry.ipAddress },
    });

    return { ok: true };
  }

  async getIpActivity(ipAddress: string) {
    const [recentLogs, isBlocked] = await Promise.all([
      this.logsRepo.find({
        where: { ipAddress },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.isIpBlocked(ipAddress),
    ]);
    return { ipAddress, isBlocked, recentLogs };
  }


  async getPolicy(): Promise<SecurityPolicyEntity> {
    let policy = await this.policyRepo.findOne({ where: { id: 'global' } });
    if (!policy) {
      policy = this.policyRepo.create({ id: 'global' });
      await this.policyRepo.save(policy);
    }
    return policy;
  }

  async updatePolicy(actor: { id: string; role: Role }, dto: UpdateSecurityPolicyDto) {
    assertCanActOnSecurity({ actorRole: actor.role, action: 'update-policy' });

    const policy = await this.getPolicy();
    Object.assign(policy, dto);
    return this.policyRepo.save(policy);
  }


  async getSecurityStats() {
    const now = new Date();

    const [criticalCount, suspiciousCount, activeBlockedIps] = await Promise.all([
      this.logsRepo.count({ where: { severity: SecuritySeverity.CRITICAL } }),
      this.logsRepo.count({ where: { isSuspicious: true } }),
      this.blockedIpRepo
        .createQueryBuilder('ip')
        .where('ip.isActive = true')
        .andWhere('(ip.blockedUntil IS NULL OR ip.blockedUntil > :now)', { now })
        .getCount(),
    ]);

    return {
      criticalEventsLast24h: criticalCount,
      suspiciousEventsLast24h: suspiciousCount,
      activeBlockedIps,
    };
  }


  private resolveSeverity(eventType: SecurityEventType): SecuritySeverity {
    if (CRITICAL_EVENTS.has(eventType)) return SecuritySeverity.CRITICAL;
    if (WARNING_EVENTS.has(eventType))  return SecuritySeverity.WARNING;
    return SecuritySeverity.INFO;
  }

  private async upsertBlock(data: {
    ipAddress: string;
    reason: BlockReason;
    notes: string | null;
    blockedUntil: Date | null;
    blockedBy: string | null;
  }): Promise<BlockedIpEntity> {
    await this.blockedIpRepo
      .createQueryBuilder()
      .insert()
      .into(BlockedIpEntity)
      .values({ ...data, isActive: true })
      .orUpdate(
        ['reason', 'notes', 'blockedUntil', 'isActive', 'blockedBy', 'updatedAt'],
        ['ipAddress'],
      )
      .execute();

    return this.blockedIpRepo.findOneOrFail({ where: { ipAddress: data.ipAddress } });
  }
}