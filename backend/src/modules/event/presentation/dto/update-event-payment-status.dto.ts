import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum PaymentStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

export class UpdateEventPaymentStatusDto {
  @ApiProperty({
    description: "Statut du paiement de l'événement",
    enum: PaymentStatusEnum,
    example: PaymentStatusEnum.PAID,
  })
  @IsEnum(PaymentStatusEnum)
  @IsNotEmpty()
  paymentStatus: PaymentStatusEnum;
}
