import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Le fichier à uploader (PDF ou image, max 10MB)',
    type: 'string',
    format: 'binary',
  })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    description: "ID de l'abonnement lié (optionnel)",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'ID du contrat lié (optionnel)',
    example: 1,
  })
  @IsOptional()
  contract_id?: number;
}
