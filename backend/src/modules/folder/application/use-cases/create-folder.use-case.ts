import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { CreateFolderAppDto } from '../dto/folder-app.dto';

/**
 * Use Case: Créer un nouveau dossier
 */
@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(dto: CreateFolderAppDto): Promise<Folder> {
    // 1. Vérifier si un dossier avec le même nom existe déjà pour cet utilisateur
    const existingFolder = await this.folderRepository.findByNameAndUserId(dto.name, dto.userId);

    if (existingFolder) {
      throw new ConflictException(`Folder with name "${dto.name}" already exists`);
    }

    // 2. Si un parentId est fourni, vérifier que le dossier parent existe
    if (dto.parentId) {
      const parentFolder = await this.folderRepository.findById(dto.parentId);

      if (!parentFolder) {
        throw new NotFoundException(`Parent folder with ID "${dto.parentId}" not found`);
      }

      // Vérifier que le parent appartient bien à l'utilisateur
      if (parentFolder.userId !== dto.userId) {
        throw new NotFoundException(`Parent folder with ID "${dto.parentId}" not found`);
      }
    }

    // 3. Créer le dossier
    const folder = new Folder({
      userId: dto.userId,
      name: dto.name,
      parentId: dto.parentId,
      color: dto.color,
      icon: dto.icon,
      isDefault: false,
    });

    // 4. Sauvegarder
    return await this.folderRepository.save(folder);
  }
}
