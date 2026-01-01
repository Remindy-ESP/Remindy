import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

export class AuditLogResponseMapper {
  static toDto(auditLog: AuditLog): AuditLogResponseDto {
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

  static toDtoArray(auditLogs: AuditLog[]): AuditLogResponseDto[] {
    return auditLogs.map(log => this.toDto(log));
  }
}
