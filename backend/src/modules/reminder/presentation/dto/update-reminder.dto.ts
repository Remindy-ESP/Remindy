import { IsOptional, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateReminderDto {
  @ApiPropertyOptional({
    description: "Nombre de jours avant l'événement",
    example: 7,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days_before?: number;

  @ApiPropertyOptional({
    description: 'Rappel activé ou non',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Canal de notification',
    enum: ['email', 'push', 'sms'],
    example: 'email',
  })
  @IsOptional()
  @IsEnum(['email', 'push', 'sms'])
  channel?: string;
}
