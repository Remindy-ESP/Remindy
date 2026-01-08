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

    // 4. Vérifier si le dossier contient des documents
    const documentCount = await this.folderRepository.countDocumentsInFolder(folderId);

    if (documentCount > 0) {
      throw new BadRequestException(
        `Cannot delete folder "${folder.name}" because it contains ${documentCount} document(s). Please move or delete the documents first.`,
      );
    }

    // 5. Vérifier si le dossier contient des sous-dossiers
    const subfolders = await this.folderRepository.findSubfolders(folderId);

    if (subfolders.length > 0) {
      throw new BadRequestException(
        `Cannot delete folder "${folder.name}" because it contains ${subfolders.length} subfolder(s). Please delete or move the subfolders first.`,
      );
    }

    // 6. Soft delete du dossier
    folder.softDelete();
    await this.folderRepository.save(folder);
  }
}
