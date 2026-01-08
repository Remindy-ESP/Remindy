/**
 * Application DTOs for Folder operations
 * Ces DTOs sont utilisés dans la couche application (use cases)
 */

/**
 * DTO pour créer un dossier
 */
export interface CreateFolderAppDto {
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

/**
 * DTO pour mettre à jour un dossier
 */
export interface UpdateFolderAppDto {
  name?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

/**
 * DTO pour filtrer les dossiers
 */
export interface FolderFilterAppDto {
  userId: string;
  parentId?: string;
  isDefault?: boolean;
  includeDeleted?: boolean;
}

/**
 * DTO pour déplacer un document dans un dossier
 */
export interface MoveDocumentToFolderAppDto {
  documentId: string;
  folderId: string;
  userId: string;
}

/**
 * DTO de réponse avec statistiques du dossier
 */
export interface FolderWithStatsAppDto {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
