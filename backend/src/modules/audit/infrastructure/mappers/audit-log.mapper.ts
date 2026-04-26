import { Injectable } from '@nestjs/common';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class AuditLogMapper {
  toDomain(entity: AdminAuditLogEntity): AuditLog {
    return AuditLog.fromProps({
      id: entity.id,
      actorUserId: entity.actorUserId,
      action: entity.action,
      resourceType: entity.resourceType,
      resourceId: entity.resourceId,
      before: entity.before,
      after: entity.after,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      severity: entity.severity,
      success: entity.success,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
    });
  }

  toEntity(domain: AuditLog): AdminAuditLogEntity {
    const entity = new AdminAuditLogEntity();
    const props = domain.toProps();

    if (props.id) {
      entity.id = props.id;
    }
    entity.actorUserId = props.actorUserId;
    entity.action = props.action;
    entity.resourceType = props.resourceType;
    entity.resourceId = props.resourceId;
    entity.before = props.before;
    entity.after = props.after;
    entity.ipAddress = props.ipAddress;
    entity.userAgent = props.userAgent;
    entity.severity = props.severity;
    entity.success = props.success;
    entity.errorMessage = props.errorMessage;
    entity.createdAt = props.createdAt;

    return entity;
  }
}
