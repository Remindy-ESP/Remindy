import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportTicketCategory } from '../../domain/enums/support-ticket-category.enum';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Sujet du ticket',
    example: 'Problème de synchronisation',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject!: string;

  @ApiProperty({
    description: 'Message initial du ticket',
    example: 'Mes rappels ne se synchronisent plus sur mobile.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({
    description: 'Catégorie du ticket',
    enum: SupportTicketCategory,
    example: SupportTicketCategory.TECHNICAL,
  })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;
}
