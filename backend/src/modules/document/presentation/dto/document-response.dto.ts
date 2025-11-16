import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty({
    description: 'ID du document',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: "ID de l'utilisateur propriétaire",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: "ID de l'abonnement lié",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscription_id?: string;

  @ApiPropertyOptional({
    description: 'ID du contrat lié',
    example: 1,
  })
  contract_id?: number;

  @ApiProperty({
    description: 'Nom du fichier',
    example: 'contrat_internet.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Clé du fichier dans R2',
    example: 'users/123e4567-e89b-12d3-a456-426614174000/documents/abc123.pdf',
  })
  r2_key: string;

  @ApiProperty({
    description: 'Bucket R2',
    example: 'remindy-documents',
  })
  r2_bucket: string;

  @ApiProperty({
    description: 'Hash SHA-256 du fichier',
    example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  })
  file_hash: string;

  @ApiProperty({
    description: 'Taille du fichier en octets',
    example: 2048576,
  })
  file_size: number;

  @ApiProperty({
    description: 'Type MIME du fichier',
    example: 'application/pdf',
  })
  mime_type: string;

  @ApiPropertyOptional({
    description: 'Texte extrait par OCR',
    example: "Contrat d'abonnement Internet...",
  })
  ocr_text?: string;

  @ApiProperty({
    description: 'Statut du traitement OCR',
    example: 'completed',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  ocr_status: string;

  @ApiPropertyOptional({
    description: "Message d'erreur OCR",
    example: 'Timeout during OCR processing',
  })
  ocr_error?: string;

  @ApiProperty({
    description: "Date d'upload",
    example: '2025-01-15T10:30:00Z',
  })
  uploaded_at: string;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-01-15T10:35:00Z',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Date de suppression (soft delete)',
    example: '2025-01-20T14:00:00Z',
  })
  deleted_at?: string;
}
