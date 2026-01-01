import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class CreateAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = AuditLog.create({
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      before: dto.before,
      after: dto.after,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      severity: dto.severity,
      success: dto.success,
      errorMessage: dto.errorMessage,
    });

    const savedLog = await this.auditLogRepository.create(auditLog);

    return this.toResponseDto(savedLog);
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
