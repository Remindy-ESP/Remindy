import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity } from '../../domain/enums/severity.enum';

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Audit log ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Actor user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  actorUserId: string | null;

  @ApiProperty({
    description: 'Action performed',
    example: 'user.ban',
  })
  action: string;

  @ApiProperty({
    description: 'Resource type',
    example: 'user',
  })
  resourceType: string;

  @ApiPropertyOptional({
    description: 'Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  resourceId: string | null;

  @ApiPropertyOptional({
    description: 'State before action',
    example: { status: 'active' },
    nullable: true,
  })
  before: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'State after action',
    example: { status: 'banned' },
    nullable: true,
  })
  after: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Client IP address',
    example: '127.0.0.1',
    nullable: true,
  })
  ipAddress: string | null;

  @ApiPropertyOptional({
    description: 'Client user agent',
    example: 'Mozilla/5.0 ...',
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'Severity level',
    enum: Severity,
    example: Severity.INFO,
  })
  severity: Severity;

  @ApiProperty({
    description: 'Whether action was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    nullable: true,
  })
  errorMessage: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-01T12:00:00.000Z',
  })
  createdAt: Date;
}

export class PaginatedAuditLogsResponseDto {
  @ApiProperty({
    description: 'List of audit logs',
    type: [AuditLogResponseDto],
  })
  data: AuditLogResponseDto[];

  @ApiProperty({
    description: 'Total number of records',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}
