import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const folder = await this.folderRepository.findById(folderId);

    if (!folder || folder.deletedAt) {
      throw new NotFoundException(`Folder with ID "${folderId}" not found`);
    }

    if (folder.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this folder');
    }

    if (folder.isDefault) {
      throw new ForbiddenException('Cannot delete default folders');
    }

    let parentId = folder.parentId || null;
    if (parentId) {
      const parent = await this.folderRepository.findById(parentId);
      if (!parent || parent.deletedAt) {
        parentId = null;
      }
    }

    const subfolders = await this.folderRepository.findSubfolders(folderId);
    for (const subfolder of subfolders) {
      subfolder.moveTo(parentId || undefined);
      await this.folderRepository.save(subfolder);
    }

    const documentCount = await this.folderRepository.countDocumentsInFolder(folderId);
    if (documentCount > 0) {
      await this.folderRepository.moveDocumentsToFolder(folderId, parentId);
    }

    await this.folderRepository.softDelete(folderId);
  }
}
