import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, MaxLength } from 'class-validator';
import { Severity } from '../../domain/enums/severity.enum';

export class CreateAuditLogRequestDto {
  @ApiProperty({
    description: 'Action performed',
    example: 'user.ban',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  action: string;

  @ApiProperty({
    description: 'Type of resource affected',
    example: 'user',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  resourceType: string;

  @ApiPropertyOptional({
    description: 'ID of the resource affected',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceId?: string;

  @ApiPropertyOptional({
    description: 'State before the action (JSONB)',
    example: { status: 'active' },
  })
  @IsOptional()
  @IsObject()
  before?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'State after the action (JSONB)',
    example: { status: 'banned' },
  })
  @IsOptional()
  @IsObject()
  after?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Severity level',
    enum: Severity,
    default: Severity.INFO,
  })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({
    description: 'Whether the action was successful',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Error message if action failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
