import { Severity } from '../enums/severity.enum';
import { AuditLog } from '../entities/audit-log.entity';

export interface AuditLogFilter {
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: Severity;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Full-text search in JSONB
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'severity';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStats {
  totalLogs: number;
  logsPerDay: { date: string; count: number }[];
  topActions: { action: string; count: number }[];
  failureRate: number;
  bySeverity: { severity: Severity; count: number }[];
  byResourceType: { resourceType: string; count: number }[];
}

export interface StatsPeriod {
  dateFrom: Date;
  dateTo: Date;
}

export abstract class IAuditLogRepository {
  abstract create(auditLog: AuditLog): Promise<AuditLog>;

  abstract findById(id: string): Promise<AuditLog | null>;

  abstract findAll(filter: AuditLogFilter): Promise<PaginatedResult<AuditLog>>;

  abstract getStats(period: StatsPeriod): Promise<AuditStats>;

  abstract deleteOlderThan(date: Date): Promise<number>;

  abstract findAllForExport(filter: AuditLogFilter): Promise<AuditLog[]>;
}
