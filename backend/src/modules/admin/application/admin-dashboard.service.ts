import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser, SupportTicketEntity } from 'src/infrastructure/database/entities';
import { UserStatus } from 'src/infrastructure/database/entities/user.entity';
import {
  SecurityLogEntity,
  SecurityEventType,
  SecuritySeverity,
} from 'src/infrastructure/database/entities/security-log.entity';
import { BlockedIpEntity } from 'src/infrastructure/database/entities/blocked-ip.entity';
import { SubscriptionEntity } from 'src/modules/subscription/infrastructure/persistence/subscription.entity';
import { DocumentEntity } from 'src/modules/document/infrastructure/persistence/document.entity';
import { InMemoryQueueService } from 'src/modules/document/infrastructure/queue/in-memory-queue.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermissions } from '../presentation/permissions/admin.permissions';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';
import { SupportTicketPriority } from 'src/modules/support/domain/enums/support-ticket-priority.enum';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(EUser)
    private readonly usersRepo: Repository<EUser>,

    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepo: Repository<SubscriptionEntity>,

    @InjectRepository(SupportTicketEntity)
    private readonly ticketsRepo: Repository<SupportTicketEntity>,

    @InjectRepository(DocumentEntity)
    private readonly documentsRepo: Repository<DocumentEntity>,

    @InjectRepository(SecurityLogEntity)
    private readonly securityLogsRepo: Repository<SecurityLogEntity>,

    @InjectRepository(BlockedIpEntity)
    private readonly blockedIpRepo: Repository<BlockedIpEntity>,

    private readonly queueService: InMemoryQueueService,
  ) {}

  async getOverview(actor: { role: Role }) {
    this.assertPermission(actor.role);

    const now = new Date();
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [users, subscriptions, support, cloud, security, jobs] = await Promise.all([
      this.getUsersStats(d24h, d7, d30),
      this.getSubscriptionsStats(now),
      this.getSupportStats(d24h),
      this.getCloudStats(d24h),
      this.getSecurityStats(d24h, now),
      this.getJobStats(),
    ]);

    return {
      generatedAt: now.toISOString(),
      users,
      subscriptions,
      support,
      cloud,
      security,
      jobs,
    };
  }

  private async getUsersStats(d24h: Date, d7: Date, d30: Date) {
    const [total, new24h, new7d, new30d, active7d, banned, verified, mfaEnabled] =
      await Promise.all([
        this.usersRepo.count(),
        this.usersRepo.createQueryBuilder('u').where('u.createdAt >= :d24h', { d24h }).getCount(),
        this.usersRepo.createQueryBuilder('u').where('u.createdAt >= :d7', { d7 }).getCount(),
        this.usersRepo.createQueryBuilder('u').where('u.createdAt >= :d30', { d30 }).getCount(),
        this.usersRepo.createQueryBuilder('u').where('u.lastLoginAt >= :d7', { d7 }).getCount(),
        this.usersRepo.count({ where: { status: UserStatus.BANNED } }),
        this.usersRepo.count({ where: { emailVerified: true } }),
        this.usersRepo.count({ where: { mfaEnabled: true } }),
      ]);

    return {
      total,
      new24h,
      new7d,
      new30d,
      active7d,
      banned,
      emailVerifiedRate: total ? Number(((verified / total) * 100).toFixed(1)) : 0,
      mfaEnabledRate: total ? Number(((mfaEnabled / total) * 100).toFixed(1)) : 0,
    };
  }

  private async getSubscriptionsStats(now: Date) {
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, active, inactive, expiringIn7d, rows] = await Promise.all([
      this.subscriptionsRepo.createQueryBuilder('s').where('s.deletedAt IS NULL').getCount(),
      this.subscriptionsRepo
        .createQueryBuilder('s')
        .where('s.deletedAt IS NULL')
        .andWhere('s.status = :status', { status: 'active' })
        .getCount(),
      this.subscriptionsRepo
        .createQueryBuilder('s')
        .where('s.deletedAt IS NULL')
        .andWhere('s.status != :status', { status: 'active' })
        .getCount(),
      this.subscriptionsRepo
        .createQueryBuilder('s')
        .where('s.deletedAt IS NULL')
        .andWhere('s.nextDueDate BETWEEN :now AND :in7d', { now, in7d })
        .getCount(),
      this.subscriptionsRepo
        .createQueryBuilder('s')
        .select(['s.amount', 's.frequency', 's.status'])
        .where('s.deletedAt IS NULL')
        .getMany(),
    ]);

    const byFrequency: Record<string, number> = {};
    let estimatedMrr = 0;

    for (const s of rows) {
      byFrequency[s.frequency] = (byFrequency[s.frequency] ?? 0) + 1;

      if (s.status !== 'active') continue;

      const amount = Number(s.amount ?? 0);
      switch (s.frequency) {
        case 'yearly':
          estimatedMrr += amount / 12;
          break;
        case 'monthly':
          estimatedMrr += amount;
          break;
        case 'weekly':
          estimatedMrr += amount * 4.33;
          break;
        default:
          break;
      }
    }

    return {
      total,
      active,
      inactive,
      expiringIn7d,
      estimatedMrr: Number(estimatedMrr.toFixed(2)),
      byFrequency,
    };
  }

  private async getSupportStats(d24h: Date) {
    const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [open, pendingUser, resolved, closed, highPriorityOpen, staleOver24h, created24h] =
      await Promise.all([
        this.ticketsRepo.count({ where: { status: SupportTicketStatus.OPEN } as any }),
        this.ticketsRepo.count({ where: { status: SupportTicketStatus.PENDING_USER } as any }),
        this.ticketsRepo.count({ where: { status: SupportTicketStatus.RESOLVED } as any }),
        this.ticketsRepo.count({ where: { status: SupportTicketStatus.CLOSED } as any }),
        this.ticketsRepo
          .createQueryBuilder('t')
          .where('t.status = :status', { status: SupportTicketStatus.OPEN })
          .andWhere('t.priority IN (:...priorities)', {
            priorities: [SupportTicketPriority.HIGH, SupportTicketPriority.URGENT],
          })
          .getCount(),
        this.ticketsRepo
          .createQueryBuilder('t')
          .where('t.status = :status', { status: SupportTicketStatus.OPEN })
          .andWhere('(t.lastReplyAt IS NULL OR t.lastReplyAt < :staleDate)', { staleDate })
          .getCount(),
        this.ticketsRepo.createQueryBuilder('t').where('t.createdAt >= :d24h', { d24h }).getCount(),
      ]);

    return {
      open,
      pendingUser,
      resolved,
      closed,
      highPriorityOpen,
      staleOver24h,
      created24h,
    };
  }

  private async getCloudStats(d24h: Date) {
    const raw = await this.documentsRepo
      .createQueryBuilder('d')
      .select('COUNT(*)', 'total')
      .addSelect('COALESCE(SUM(d.fileSize), 0)', 'storage')
      .addSelect(`COUNT(*) FILTER (WHERE d.ocrStatus = 'pending')`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE d.ocrStatus = 'processing')`, 'processing')
      .addSelect(`COUNT(*) FILTER (WHERE d.ocrStatus = 'completed')`, 'completed')
      .addSelect(`COUNT(*) FILTER (WHERE d.ocrStatus = 'failed')`, 'failed')
      .addSelect(`COUNT(*) FILTER (WHERE d.uploadedAt >= :d24h)`, 'uploaded24h')
      .where('d.deletedAt IS NULL')
      .setParameter('d24h', d24h)
      .getRawOne();

    const totalDocuments = Number(raw.total ?? 0);
    const totalStorageBytes = Number(raw.storage ?? 0);
    const ocrFailed = Number(raw.failed ?? 0);

    return {
      totalDocuments,
      totalStorageBytes,
      totalStorageFormatted: this.formatBytes(totalStorageBytes),
      ocrPending: Number(raw.pending ?? 0),
      ocrProcessing: Number(raw.processing ?? 0),
      ocrCompleted: Number(raw.completed ?? 0),
      ocrFailed,
      ocrFailureRate: totalDocuments ? Number(((ocrFailed / totalDocuments) * 100).toFixed(1)) : 0,
      uploaded24h: Number(raw.uploaded24h ?? 0),
    };
  }

  private async getSecurityStats(d24h: Date, now: Date) {
    const [loginFailures24h, suspicious24h, critical24h, csrfViolations24h, activeBlockedIps] =
      await Promise.all([
        this.securityLogsRepo
          .createQueryBuilder('l')
          .where('l.eventType = :eventType', { eventType: SecurityEventType.LOGIN_FAILURE })
          .andWhere('l.createdAt >= :d24h', { d24h })
          .getCount(),
        this.securityLogsRepo
          .createQueryBuilder('l')
          .where('l.isSuspicious = true')
          .andWhere('l.createdAt >= :d24h', { d24h })
          .getCount(),
        this.securityLogsRepo
          .createQueryBuilder('l')
          .where('l.severity = :severity', { severity: SecuritySeverity.CRITICAL })
          .andWhere('l.createdAt >= :d24h', { d24h })
          .getCount(),
        this.securityLogsRepo
          .createQueryBuilder('l')
          .where('l.eventType = :eventType', { eventType: SecurityEventType.CSRF_VIOLATION })
          .andWhere('l.createdAt >= :d24h', { d24h })
          .getCount(),
        this.blockedIpRepo
          .createQueryBuilder('ip')
          .where('ip.isActive = true')
          .andWhere('(ip.blockedUntil IS NULL OR ip.blockedUntil > :now)', { now })
          .getCount(),
      ]);

    return {
      loginFailures24h,
      suspicious24h,
      critical24h,
      csrfViolations24h,
      activeBlockedIps,
    };
  }

  private async getJobStats() {
    const stats = await this.queueService.getQueueStats();
    const total = stats.waiting + stats.active + stats.completed + stats.failed + stats.delayed;

    return {
      ...stats,
      errorRate: total ? Number(((stats.failed / total) * 100).toFixed(1)) : 0,
    };
  }

  private assertPermission(role: Role) {
    const perms = permissionsForRole(role);
    if (!perms.includes(AdminPermissions.DASHBOARD_READ)) {
      throw new ForbiddenException(`Permission requise : ${AdminPermissions.DASHBOARD_READ}`);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index++;
    }

    return `${value.toFixed(1)} ${units[index]}`;
  }
}
