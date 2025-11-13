import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import type { IDocumentRepository } from '../../../document/application/ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../../../document/application/ports/document-repository.interface';
import { MoveDocumentToFolderAppDto } from '../dto/folder-app.dto';

/**
 * Use Case: Déplacer un document dans un dossier
 */
@Injectable()
export class MoveDocumentToFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(dto: MoveDocumentToFolderAppDto): Promise<void> {
    // 1. Vérifier que le document existe
    const document = await this.documentRepository.findById(dto.documentId);

    if (!document) {
      throw new NotFoundException(`Document with ID "${dto.documentId}" not found`);
    }

    // 2. Vérifier que le document appartient à l'utilisateur
    if (document.userId !== dto.userId) {
      throw new ForbiddenException('You do not have permission to move this document');
    }

    // 3. Vérifier que le dossier existe
    const folder = await this.folderRepository.findById(dto.folderId);

    if (!folder) {
      throw new NotFoundException(`Folder with ID "${dto.folderId}" not found`);
    }

    // 4. Vérifier que le dossier appartient à l'utilisateur
    if (folder.userId !== dto.userId) {
      throw new ForbiddenException('You do not have permission to move documents to this folder');
    }

    // 5. Déplacer le document dans le dossier
    document.moveToFolder(dto.folderId);

    // 6. Sauvegarder
    await this.documentRepository.save(document);
  }
}
