import { Severity } from '../../domain/enums/severity.enum';

export class AuditLogFilterDto {
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: Severity;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'severity';
  sortOrder?: 'ASC' | 'DESC';
}

export class ExportAuditLogsDto {
  format: 'csv' | 'json';
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  severity?: Severity;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
