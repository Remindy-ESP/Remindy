import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketPriority } from 'src/modules/support/domain/enums/support-ticket-priority.enum';
import { TicketsPaginationQueryDto } from 'src/modules/support/application/dto/tickets-pagination-query.dto';

export class AdminTicketsQueryDto extends TicketsPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Recherche sur sujet, email et nom utilisateur' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

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
