import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength, Matches } from 'class-validator';

/**
 * DTO pour créer un nouveau dossier
 */
export class CreateFolderDto {
  @ApiProperty({
    description: 'Nom du dossier',
    example: 'Mes factures 2024',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'ID du dossier parent (pour créer un sous-dossier)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Couleur du dossier au format hex',
    example: '#3B82F6',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be in hex format (e.g., #3B82F6)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Icône du dossier (emoji ou nom d\'icône)',
    example: '📁',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

/**
 * DTO pour mettre à jour un dossier
 */
export class UpdateFolderDto {
  @ApiPropertyOptional({
    description: 'Nouveau nom du dossier',
    example: 'Factures EDF 2024',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle couleur du dossier',
    example: '#10B981',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be in hex format (e.g., #10B981)',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Nouvelle icône du dossier',
    example: '⚡',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({
    description: 'ID du nouveau dossier parent (pour déplacer le dossier)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

/**
 * DTO de réponse pour un dossier
 */
export class FolderResponseDto {
  @ApiProperty({
    description: 'ID du dossier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Nom du dossier',
    example: 'Factures',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'ID du dossier parent',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Couleur du dossier',
    example: '#3B82F6',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Icône du dossier',
    example: '📁',
  })
  icon?: string;

  @ApiProperty({
    description: 'Si le dossier est créé automatiquement par le système',
    example: true,
  })
  isDefault: boolean;

  @ApiPropertyOptional({
    description: 'Nombre de documents dans le dossier',
    example: 12,
  })
  documentCount?: number;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière modification',
    example: '2024-01-20T14:45:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Date de suppression (soft delete)',
    example: null,
  })
  deletedAt?: Date;
}

/**
 * DTO pour filtrer les dossiers
 */
export class FolderFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrer par ID du dossier parent (sous-dossiers uniquement)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par dossiers par défaut uniquement',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Inclure les dossiers supprimés',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}

/**
 * DTO pour déplacer un document dans un dossier
 */
export class MoveDocumentDto {
  @ApiProperty({
    description: 'ID du document à déplacer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  documentId: string;
}
