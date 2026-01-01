import { Severity } from '../../domain/enums/severity.enum';

export class AuditLogResponseDto {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: Severity;
  success: boolean;
  errorMessage: string | null;
  createdAt: Date;
}

export class PaginatedAuditLogsResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
