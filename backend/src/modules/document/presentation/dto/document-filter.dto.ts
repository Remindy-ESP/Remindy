import { IsOptional, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DocumentFilterDto {
  @ApiPropertyOptional({
    description: "Filtrer par ID d'abonnement",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de contrat',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contract_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par statut OCR',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({
    description: 'Filtrer par type MIME',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsEnum(['application/pdf', 'image/png', 'image/jpeg'])
  mime_type?: string;

  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats',
    example: 100,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Tri des résultats (uploaded_at:asc|desc)',
    example: 'uploaded_at:desc',
    default: 'uploaded_at:desc',
  })
  @IsOptional()
  sort?: string;
}
