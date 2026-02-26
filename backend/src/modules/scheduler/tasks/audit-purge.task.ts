import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PurgeAuditLogsUseCase } from '../../audit/application/use-cases/purge-audit-logs.use-case';

@Injectable()
export class AuditPurgeTask {
  private readonly logger = new Logger(AuditPurgeTask.name);

  constructor(private readonly purgeAuditLogsUseCase: PurgeAuditLogsUseCase) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron(): Promise<void> {
    this.logger.log('Starting audit purge task...');

    try {
      const result = await this.purgeAuditLogsUseCase.execute();

      this.logger.log(
        `Audit purge task completed. Deleted ${result.deletedCount} logs older than ${result.cutoffDate.toISOString()} (retention=${result.retentionDays}d)`,
      );
    } catch (error) {
      this.logger.error(`Audit purge task failed: ${error}`);
    }
  }

  async triggerManually(params?: {
    retentionDays?: number;
    now?: Date;
  }): Promise<{ deletedCount: number; cutoffDate: Date; retentionDays: number }> {
    this.logger.log('Manually triggering audit purge...');

    return this.purgeAuditLogsUseCase.execute(params);
  }
}
