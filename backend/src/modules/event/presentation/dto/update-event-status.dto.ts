import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum EventStatusEnum {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  FAILED = 'failed',
}

export class UpdateEventStatusDto {
  @ApiProperty({
    description: 'Nouveau statut de l\'événement',
    enum: EventStatusEnum,
    example: EventStatusEnum.COMPLETED,
  })
  @IsEnum(EventStatusEnum)
  @IsNotEmpty()
  status: EventStatusEnum;
}
