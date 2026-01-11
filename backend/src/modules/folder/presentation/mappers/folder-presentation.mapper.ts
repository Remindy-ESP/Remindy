import { Folder } from '../../domain/folder.entity';
import { FolderResponseDto, FolderFilterDto } from '../dto/folder.dto';
import {
  CreateFolderAppDto,
  UpdateFolderAppDto,
  FolderFilterAppDto,
  MoveDocumentToFolderAppDto,
} from '../../application/dto/folder-app.dto';

/**
 * Mapper pour la couche présentation des dossiers
 * Convertit entre les DTOs de présentation et les DTOs d'application
 */
export class FolderPresentationMapper {
  /**
   * Convertir une entité domaine en DTO de réponse
   */
  static toResponseDto(folder: Folder, documentCount?: number): FolderResponseDto {
    return {
      id: folder.id!,
      userId: folder.userId,
      name: folder.name,
      parentId: folder.parentId,
      color: folder.color,
      icon: folder.icon,
      isDefault: folder.isDefault,
      documentCount,
      createdAt: folder.createdAt!,
      updatedAt: folder.updatedAt!,
      deletedAt: folder.deletedAt,
    };
  }

  /**
   * Convertir un tableau d'entités domaine en tableau de DTOs de réponse
   */
  static toResponseDtoArray(
    folders: Folder[],
    documentCounts?: Map<string, number>,
  ): FolderResponseDto[] {
    return folders.map(folder => {
      const documentCount = documentCounts ? documentCounts.get(folder.id!) : undefined;
      return this.toResponseDto(folder, documentCount);
    });
  }

  /**
   * Convertir un DTO de création en DTO d'application
   */
  static toCreateAppDto(userId: string, dto: any): CreateFolderAppDto {
    return {
      userId,
      name: dto.name,
      parentId: dto.parentId,
      color: dto.color,
      icon: dto.icon,
    };
  }

  /**
   * Convertir un DTO de mise à jour en DTO d'application
   */
  static toUpdateAppDto(dto: any): UpdateFolderAppDto {
    return {
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
      parentId: dto.parentId,
    };
  }

  /**
   * Convertir un DTO de filtre en DTO d'application
   */
  static toFilterAppDto(userId: string, dto: FolderFilterDto): FolderFilterAppDto {
    return {
      userId,
      parentId: dto.parentId,
      isDefault: dto.isDefault,
      includeDeleted: dto.includeDeleted || false,
    };
  }

  /**
   * Convertir un DTO de déplacement de document en DTO d'application
   */
  static toMoveDocumentAppDto(
    userId: string,
    folderId: string,
    documentId: string,
  ): MoveDocumentToFolderAppDto {
    return {
      userId,
      folderId,
      documentId,
    };
  }
}
