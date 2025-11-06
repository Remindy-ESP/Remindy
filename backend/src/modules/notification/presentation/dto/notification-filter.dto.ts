import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class NotificationFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrer par type de notification',
    enum: ['reminder', 'payment_overdue', 'trial_ending', 'subscription_renewed', 'document_processed'],
    example: 'reminder',
  })
  @IsOptional()
  @IsEnum(['reminder', 'payment_overdue', 'trial_ending', 'subscription_renewed', 'document_processed'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par canal',
    enum: ['email', 'push', 'sms'],
    example: 'push',
  })
  @IsOptional()
  @IsEnum(['email', 'push', 'sms'])
  channel?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    enum: ['pending', 'sent', 'failed', 'snoozed'],
    example: 'sent',
  })
  @IsOptional()
  @IsEnum(['pending', 'sent', 'failed', 'snoozed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par état de lecture',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats',
    example: 50,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Tri des résultats (created_at:asc|desc)',
    example: 'created_at:desc',
    default: 'created_at:desc',
  })
  @IsOptional()
  sort?: string;
}
