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

        // TODO: Vérifier les boucles plus profondes (parent du parent, etc.)
        // Pour une implémentation complète, il faudrait vérifier toute la chaîne
      }

      folder.moveTo(dto.parentId);
    }

    // 5. Sauvegarder
    return await this.folderRepository.save(folder);
  }
}
