import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Nouveau nom du fichier',
    example: 'facture-netflix-janvier-2024.pdf',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Filename cannot be empty' })
  @MaxLength(255, { message: 'Filename cannot exceed 255 characters' })
  filename?: string;

  @ApiPropertyOptional({
    description: 'ID du dossier de destination (null pour retirer du dossier)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Folder ID must be a valid UUID' })
  folder_id?: string;
}
