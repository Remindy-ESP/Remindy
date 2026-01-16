import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';

/**
 * Use Case: Supprimer un dossier (soft delete)
 */
@Injectable()
export class DeleteFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(folderId: string, userId: string): Promise<void> {
    // 1. Récupérer le dossier
    const folder = await this.folderRepository.findById(folderId);

    if (!folder) {
      throw new NotFoundException(`Folder with ID "${folderId}" not found`);
    }

    // 2. Vérifier que le dossier appartient à l'utilisateur
    if (folder.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this folder');
    }

    // 3. Empêcher la suppression des dossiers par défaut
    if (folder.isDefault) {
      throw new ForbiddenException('Cannot delete default folders');
    }

    // 4. Move contents to parent before deletion
    const parentId = folder.parentId || null;

    // Move all subfolders to this folder's parent
    const subfolders = await this.folderRepository.findSubfolders(folderId);
    if (subfolders.length > 0) {
      for (const subfolder of subfolders) {
        subfolder.moveTo(parentId || undefined);
        await this.folderRepository.save(subfolder);
      }
    }

    // Move all documents to this folder's parent
    const documentCount = await this.folderRepository.countDocumentsInFolder(folderId);
    if (documentCount > 0) {
      await this.folderRepository.moveDocumentsToFolder(folderId, parentId);
    }

    // 5. Soft delete du dossier
    folder.softDelete();
    await this.folderRepository.save(folder);
  }
}
