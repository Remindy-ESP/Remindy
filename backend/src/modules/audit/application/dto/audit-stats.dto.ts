import { Severity } from '../../domain/enums/severity.enum';

export class AuditStatsRequestDto {
  dateFrom: Date;
  dateTo: Date;
}

export class LogsPerDayDto {
  date: string;
  count: number;
}

export class TopActionsDto {
  action: string;
  count: number;
}

export class BySeverityDto {
  severity: Severity;
  count: number;
}

export class ByResourceTypeDto {
  resourceType: string;
  count: number;
}

export class AuditStatsResponseDto {
  totalLogs: number;
  logsPerDay: LogsPerDayDto[];
  topActions: TopActionsDto[];
  failureRate: number;
  bySeverity: BySeverityDto[];
  byResourceType: ByResourceTypeDto[];
}
