import { Inject, Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';

export interface PurgeAuditLogsResult {
  deletedCount: number;
  cutoffDate: Date;
  retentionDays: number;
}

@Injectable()
export class PurgeAuditLogsUseCase {
  private static readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(
    @Inject(IAuditLogRepository)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(params?: { retentionDays?: number; now?: Date }): Promise<PurgeAuditLogsResult> {
    const retentionDays = this.resolveRetentionDays(params?.retentionDays);
    const now = params?.now ?? new Date();
    const cutoffDate = this.computeCutoffDate(now, retentionDays);

    const deletedCount = await this.auditLogRepository.deleteOlderThan(cutoffDate);

    return {
      deletedCount,
      cutoffDate,
      retentionDays,
    };
  }

  private resolveRetentionDays(override?: number): number {
    if (override !== undefined) {
      this.validateRetentionDays(override);
      return override;
    }

    const fromEnv = process.env.AUDIT_LOG_RETENTION_DAYS;
    if (!fromEnv) {
      return PurgeAuditLogsUseCase.DEFAULT_RETENTION_DAYS;
    }

    const parsed = Number(fromEnv);
    this.validateRetentionDays(parsed);
    return parsed;
  }

  private validateRetentionDays(retentionDays: number): void {
    if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
      throw new Error('AUDIT_LOG_RETENTION_DAYS must be a positive integer');
    }
  }

  private computeCutoffDate(now: Date, retentionDays: number): Date {
    return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  }
}
