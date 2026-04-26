import { ApiProperty } from '@nestjs/swagger';
import { Severity } from '../../domain/enums/severity.enum';

export class LogsPerDayResponseDto {
  @ApiProperty({
    description: 'Date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  date: string;

  @ApiProperty({
    description: 'Number of logs',
    example: 42,
  })
  count: number;
}

export class TopActionsResponseDto {
  @ApiProperty({
    description: 'Action name',
    example: 'user.login',
  })
  action: string;

  @ApiProperty({
    description: 'Number of occurrences',
    example: 150,
  })
  count: number;
}

export class BySeverityResponseDto {
  @ApiProperty({
    description: 'Severity level',
    enum: Severity,
    example: Severity.INFO,
  })
  severity: Severity;

  @ApiProperty({
    description: 'Number of logs',
    example: 100,
  })
  count: number;
}

export class ByResourceTypeResponseDto {
  @ApiProperty({
    description: 'Resource type',
    example: 'user',
  })
  resourceType: string;

  @ApiProperty({
    description: 'Number of logs',
    example: 50,
  })
  count: number;
}

export class AuditStatsResponseDto {
  @ApiProperty({
    description: 'Total number of logs in period',
    example: 1000,
  })
  totalLogs: number;

  @ApiProperty({
    description: 'Logs per day',
    type: [LogsPerDayResponseDto],
  })
  logsPerDay: LogsPerDayResponseDto[];

  @ApiProperty({
    description: 'Top 10 actions',
    type: [TopActionsResponseDto],
  })
  topActions: TopActionsResponseDto[];

  @ApiProperty({
    description: 'Failure rate percentage',
    example: 2.5,
  })
  failureRate: number;

  @ApiProperty({
    description: 'Logs by severity',
    type: [BySeverityResponseDto],
  })
  bySeverity: BySeverityResponseDto[];

  @ApiProperty({
    description: 'Top 10 resource types',
    type: [ByResourceTypeResponseDto],
  })
  byResourceType: ByResourceTypeResponseDto[];
}
