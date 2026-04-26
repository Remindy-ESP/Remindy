import { Injectable } from '@nestjs/common';
import { IAuditExportService } from '../../application/ports/audit-export.service';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class AuditExportService extends IAuditExportService {
  toCsv(logs: AuditLog[]): string {
    const headers = [
      'id',
      'actor_user_id',
      'action',
      'resource_type',
      'resource_id',
      'before',
      'after',
      'ip_address',
      'user_agent',
      'severity',
      'success',
      'error_message',
      'created_at',
    ];

    const rows = logs.map(log => [
      log.getId(),
      log.getActorUserId() ?? '',
      log.getAction(),
      log.getResourceType(),
      log.getResourceId() ?? '',
      log.getBefore() ? JSON.stringify(log.getBefore()) : '',
      log.getAfter() ? JSON.stringify(log.getAfter()) : '',
      log.getIpAddress() ?? '',
      log.getUserAgent() ?? '',
      log.getSeverity(),
      log.isSuccess().toString(),
      log.getErrorMessage() ?? '',
      log.getCreatedAt().toISOString(),
    ]);

    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const escapedRow = row.map(field => {
        const stringField = String(field);
        // Escape fields that contain commas, quotes, or newlines
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      });
      csvRows.push(escapedRow.join(','));
    }

    return csvRows.join('\n');
  }

  toJson(logs: AuditLog[]): string {
    const data = logs.map(log => ({
      id: log.getId(),
      actorUserId: log.getActorUserId(),
      action: log.getAction(),
      resourceType: log.getResourceType(),
      resourceId: log.getResourceId(),
      before: log.getBefore(),
      after: log.getAfter(),
      ipAddress: log.getIpAddress(),
      userAgent: log.getUserAgent(),
      severity: log.getSeverity(),
      success: log.isSuccess(),
      errorMessage: log.getErrorMessage(),
      createdAt: log.getCreatedAt().toISOString(),
    }));

    return JSON.stringify(data, null, 2);
  }
}
