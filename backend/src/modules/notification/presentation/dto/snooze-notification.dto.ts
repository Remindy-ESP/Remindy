import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SnoozeNotificationDto {
  @ApiProperty({
    description: 'Date et heure jusqu\'à laquelle reporter la notification',
    example: '2025-11-10T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  snoozed_until: string;
}
