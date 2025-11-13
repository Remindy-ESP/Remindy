import { Injectable, Inject } from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { FolderFilterAppDto } from '../dto/folder-app.dto';

/**
 * Use Case: Récupérer tous les dossiers d'un utilisateur
 */
@Injectable()
export class FindAllFoldersUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(filters: FolderFilterAppDto): Promise<Folder[]> {
    // Si on filtre par parentId, récupérer les sous-dossiers
    if (filters.parentId) {
      return await this.folderRepository.findSubfolders(filters.parentId);
    }

    // Si on filtre par isDefault
    if (filters.isDefault !== undefined) {
      return await this.folderRepository.findDefaultFoldersByUserId(filters.userId);
    }

    // Récupérer tous les dossiers de l'utilisateur
    return await this.folderRepository.findByUserId(
      filters.userId,
      filters.includeDeleted || false,
    );
  }
}
