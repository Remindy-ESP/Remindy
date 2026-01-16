import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { UpdateFolderAppDto } from '../dto/folder-app.dto';

/**
 * Use Case: Mettre à jour un dossier
 */
@Injectable()
export class UpdateFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(folderId: string, userId: string, dto: UpdateFolderAppDto): Promise<Folder> {
    // 1. Récupérer le dossier
    const folder = await this.folderRepository.findById(folderId);

    if (!folder) {
      throw new NotFoundException(`Folder with ID "${folderId}" not found`);
    }

    // 2. Vérifier que le dossier appartient à l'utilisateur
    if (folder.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this folder');
    }

    // 3. Empêcher la modification des dossiers par défaut (nom uniquement)
    if (folder.isDefault && dto.name && dto.name !== folder.name) {
      throw new ForbiddenException('Cannot rename default folders');
    }

    // 4. Appliquer les modifications
    if (dto.name) {
      folder.rename(dto.name);
    }

    if (dto.color !== undefined) {
      folder.changeColor(dto.color);
    }

    if (dto.icon !== undefined) {
      folder.changeIcon(dto.icon);
    }

    if (dto.parentId !== undefined) {
      // Si on veut déplacer le dossier
      if (dto.parentId) {
        // Vérifier que le parent existe et appartient à l'utilisateur
        const parentFolder = await this.folderRepository.findById(dto.parentId);

        if (!parentFolder) {
          throw new NotFoundException(`Parent folder with ID "${dto.parentId}" not found`);
        }

        if (parentFolder.userId !== userId) {
          throw new ForbiddenException('Parent folder does not belong to you');
        }

        // Empêcher les boucles: un dossier ne peut pas être son propre parent
        if (dto.parentId === folderId) {
          throw new ForbiddenException('A folder cannot be its own parent');
        }

        // Vérifier les boucles circulaires en remontant toute la chaîne des parents
        await this.checkCircularHierarchy(folderId, dto.parentId);
      }

      folder.moveTo(dto.parentId);
    }

    // 5. Sauvegarder
    return await this.folderRepository.save(folder);
  }

  /**
   * Vérifie qu'il n'y a pas de boucle circulaire dans la hiérarchie des dossiers
   * En remontant la chaîne des parents depuis le nouveau parent proposé
   */
  private async checkCircularHierarchy(folderId: string, newParentId: string): Promise<void> {
    let currentParentId: string | null = newParentId;
    const visitedIds = new Set<string>();
    const maxDepth = 100; // Protection contre les boucles infinies
    let depth = 0;

    while (currentParentId && depth < maxDepth) {
      // Si on retombe sur le dossier qu'on essaie de déplacer, c'est une boucle
      if (currentParentId === folderId) {
        throw new ForbiddenException(
          'Cannot move folder: this would create a circular hierarchy'
        );
      }

      // Protection contre les boucles infinies
      if (visitedIds.has(currentParentId)) {
        throw new ForbiddenException(
          'Circular hierarchy detected in existing folder structure'
        );
      }

      visitedIds.add(currentParentId);

      // Remonter au parent suivant
      const parentFolder = await this.folderRepository.findById(currentParentId);
      if (!parentFolder) {
        break; // Parent n'existe pas, on arrête
      }

      currentParentId = parentFolder.parentId || null;
      depth++;
    }

    if (depth >= maxDepth) {
      throw new ForbiddenException('Folder hierarchy is too deep (max 100 levels)');
    }
  }
}
