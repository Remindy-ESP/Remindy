import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketPriority } from 'src/modules/support/domain/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';
import { SupportTicketCategory } from 'src/modules/support/domain/enums/support-ticket-category.enum';

export class AdminTicketsQueryDto {
  @ApiPropertyOptional({ description: 'Recherche sur sujet, email et nom utilisateur' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @ApiPropertyOptional({ enum: SupportTicketCategory })
  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    enum: ['createdAt', 'updatedAt', 'lastReplyAt', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'lastReplyAt', 'priority', 'status'])
  sortBy: 'createdAt' | 'updatedAt' | 'lastReplyAt' | 'priority' | 'status' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir: 'ASC' | 'DESC' = 'DESC';
}
