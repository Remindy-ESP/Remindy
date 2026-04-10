import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReplySupportTicketDto {
  @ApiProperty({
    description: 'Message de réponse utilisateur',
    example: 'Merci, voici des précisions supplémentaires.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;
}
