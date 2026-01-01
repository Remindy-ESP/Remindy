import { Injectable } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { PaginatedAuditLogsResponseDto } from '../dto/audit-log-response.dto';
import { AuditLogResponseMapper } from '../mappers/audit-log-response.mapper';

@Injectable()
export class FindAllAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(filter: AuditLogFilterDto): Promise<PaginatedAuditLogsResponseDto> {
    const result = await this.auditLogRepository.findAll({
      actorUserId: filter.actorUserId,
      action: filter.action,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      severity: filter.severity,
      success: filter.success,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      search: filter.search,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      sortBy: filter.sortBy ?? 'createdAt',
      sortOrder: filter.sortOrder ?? 'DESC',
    });

    return {
      data: AuditLogResponseMapper.toDtoArray(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';
import { AuditLogResponseDto, PaginatedAuditLogsResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class FindAllAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(filter: AuditLogFilterDto): Promise<PaginatedAuditLogsResponseDto> {
    const result = await this.auditLogRepository.findAll({
      actorUserId: filter.actorUserId,
      action: filter.action,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      severity: filter.severity,
      success: filter.success,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      search: filter.search,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      sortBy: filter.sortBy ?? 'createdAt',
      sortOrder: filter.sortOrder ?? 'DESC',
    });

    return {
      data: result.data.map(log => this.toResponseDto(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private toResponseDto(auditLog: AuditLog): AuditLogResponseDto {
    return {
      id: auditLog.getId(),
      actorUserId: auditLog.getActorUserId(),
      action: auditLog.getAction(),
      resourceType: auditLog.getResourceType(),
      resourceId: auditLog.getResourceId(),
      before: auditLog.getBefore(),
      after: auditLog.getAfter(),
      ipAddress: auditLog.getIpAddress(),
      userAgent: auditLog.getUserAgent(),
      severity: auditLog.getSeverity(),
      success: auditLog.isSuccess(),
      errorMessage: auditLog.getErrorMessage(),
      createdAt: auditLog.getCreatedAt(),
    };
  }
}
