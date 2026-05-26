import { ApiProperty } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Monthly streaming' })
  name: string;

  @ApiProperty({ example: 50, description: 'Budget amount in decimal' })
  amount: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ enum: ['monthly', 'yearly'], example: 'monthly' })
  period: 'monthly' | 'yearly';

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-02-01T00:00:00Z', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  categoryId: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-15T12:30:00Z' })
  updatedAt: Date;
}
