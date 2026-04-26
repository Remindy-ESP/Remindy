import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Severity } from 'src/modules/audit/domain/enums/severity.enum';

export class AdminAuditQueryDto {
  @ApiPropertyOptional({ description: "UUID de l'admin auteur de l'action" })
  @IsOptional()
  @IsUUID()
  actor?: string;

  @ApiPropertyOptional({
    example: 'user.ban',
    description: "Filtre partiel sur le nom de l'action",
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'user', description: 'Filtre partiel sur le type de ressource' })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ example: 'uuid-de-la-ressource' })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ enum: ['info', 'warning', 'critical'] })
  @IsOptional()
  @IsEnum(['info', 'warning', 'critical'])
  severity?: Severity;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Recherche plein-texte dans les champs before/after (JSONB)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'action', 'severity'], default: 'createdAt' })
  @IsOptional()
  @IsEnum(['createdAt', 'action', 'severity'])
  sortBy?: 'createdAt' | 'action' | 'severity' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
