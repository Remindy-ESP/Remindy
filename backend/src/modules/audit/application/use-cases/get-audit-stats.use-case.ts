import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditStatsRequestDto, AuditStatsResponseDto } from '../dto/audit-stats.dto';

@Injectable()
export class GetAuditStatsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(dto: AuditStatsRequestDto): Promise<AuditStatsResponseDto> {
    const stats = await this.auditLogRepository.getStats({
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
    });

    return {
      totalLogs: stats.totalLogs,
      logsPerDay: stats.logsPerDay,
      topActions: stats.topActions,
      failureRate: stats.failureRate,
      bySeverity: stats.bySeverity,
      byResourceType: stats.byResourceType,
    };
  }
}
