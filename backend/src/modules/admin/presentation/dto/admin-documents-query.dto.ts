import { IsOptional, IsString, IsIn, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminDocumentsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par utilisateur' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par subscription' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsIn(['pending', 'processing', 'completed', 'failed'])
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Recherche par nom de fichier (ILIKE)' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type MIME', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ description: 'Date upload >= (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  uploadedFrom?: string;

  @ApiPropertyOptional({ description: 'Date upload <= (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  uploadedTo?: string;

  @ApiPropertyOptional({
    enum: ['uploadedAt', 'filename', 'fileSize', 'ocrStatus'],
    default: 'uploadedAt',
  })
  @IsOptional()
  @IsIn(['uploadedAt', 'filename', 'fileSize', 'ocrStatus'])
  sortBy?: string = 'uploadedAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit: number = 10000;
}
