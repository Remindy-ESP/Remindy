import { AuditLog } from '../../domain/entities/audit-log.entity';

export abstract class IAuditExportService {
  abstract toCsv(logs: AuditLog[]): string;
  abstract toJson(logs: AuditLog[]): string;
}
