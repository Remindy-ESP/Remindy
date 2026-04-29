import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type {
  RgpdExportRequestedBy,
  RgpdExportStatus,
} from 'src/infrastructure/database/entities/rgpd-export.entity';

export class RgpdExportsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par utilisateur' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
    description: 'Filtrer par statut',
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed', 'expired'] as const)
  status?: RgpdExportStatus;

  @ApiPropertyOptional({
    enum: ['user', 'admin', 'automated'],
    description: 'Filtrer par demandeur',
  })
  @IsOptional()
  @IsEnum(['user', 'admin', 'automated'] as const)
  requestedBy?: RgpdExportRequestedBy;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
