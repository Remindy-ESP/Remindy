import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateRoleLimitDto {
  @ApiProperty({
    description: 'Maximum number of subscriptions allowed',
    example: 10,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSubscriptions?: number | null;

  @ApiProperty({
    description: 'Maximum number of documents allowed',
    example: 100,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDocuments?: number | null;

  @ApiProperty({
    description: 'Maximum document size in MB',
    example: 10,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDocumentSizeMb?: number | null;

  @ApiProperty({
    description: 'Maximum reminders per subscription',
    example: 50,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRemindersPerSubscription?: number | null;

  @ApiProperty({
    description: 'Can export data',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canExportData?: boolean;

  @ApiProperty({
    description: 'Can use OCR',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  canUseOcr?: boolean;
}
