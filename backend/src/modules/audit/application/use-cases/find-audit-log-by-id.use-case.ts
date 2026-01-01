import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

@Injectable()
export class FindAuditLogByIdUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogRepository.findById(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return this.toResponseDto(auditLog);
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
