import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportTicketStatus } from 'src/modules/support/domain/enums/support-ticket-status.enum';
export class AdminReplyTicketDto {
  @ApiProperty({
    description: 'Message de réponse de l’administrateur',
    example: 'Bonjour, nous avons bien pris en compte votre demande.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @ApiPropertyOptional({
    description: 'Statut à appliquer après la réponse',
    enum: SupportTicketStatus,
  })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;
}
