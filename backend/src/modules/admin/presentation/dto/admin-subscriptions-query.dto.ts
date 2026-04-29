import { IsOptional, IsString, IsIn, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminSubscriptionsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrer par utilisateur' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: ['active', 'paused', 'cancelled', 'trial'] })
  @IsOptional()
  @IsIn(['active', 'paused', 'cancelled', 'trial'])
  status?: string;

  @ApiPropertyOptional({ enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @IsOptional()
  @IsIn(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'])
  frequency?: string;

  @ApiPropertyOptional({ description: 'Recherche par nom (ILIKE)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Montant minimum', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMin?: number;

  @ApiPropertyOptional({ description: 'Montant maximum', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountMax?: number;

  @ApiPropertyOptional({ description: 'Créé après (ISO 8601)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Créé avant (ISO 8601)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'amount', 'nextDueDate', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'amount', 'nextDueDate', 'status'])
  sortBy?: string = 'createdAt';

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
  limit: number = 20;
}
