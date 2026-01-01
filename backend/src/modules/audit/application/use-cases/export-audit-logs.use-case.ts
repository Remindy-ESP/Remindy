import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { ExportAuditLogsDto } from '../dto/audit-log-filter.dto';
import { IAuditExportService } from '../ports/audit-export.service';

@Injectable()
export class ExportAuditLogsUseCase {
  constructor(
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly exportService: IAuditExportService,
  ) {}

  async execute(dto: ExportAuditLogsDto): Promise<{ data: string; contentType: string }> {
    const logs = await this.auditLogRepository.findAllForExport({
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      severity: dto.severity,
      success: dto.success,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      search: dto.search,
    });

    if (dto.format === 'csv') {
      return {
        data: this.exportService.toCsv(logs),
        contentType: 'text/csv',
      };
    }

    return {
      data: this.exportService.toJson(logs),
      contentType: 'application/json',
    };
  }
}
