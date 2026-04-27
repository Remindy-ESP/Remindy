import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IFolderRepository } from '../ports/folder-repository.interface';
import { FOLDER_REPOSITORY } from '../ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';

/**
 * Use Case: Initialiser les dossiers par défaut pour un nouvel utilisateur
 *
 * Crée automatiquement les dossiers suivants :
 * - Factures
 * - Contrats
 * - Documents administratifs
 */
@Injectable()
export class InitializeDefaultFoldersUseCase {
  private readonly logger = new Logger(InitializeDefaultFoldersUseCase.name);

  // Configuration des dossiers par défaut
  private readonly DEFAULT_FOLDERS = [
    {
      name: 'Factures',
      icon: '📄',
      color: '#3B82F6', // Bleu
    },
    {
      name: 'Contrats',
      icon: '📋',
      color: '#10B981', // Vert
    },
    {
      name: 'Documents administratifs',
      icon: '📁',
      color: '#F59E0B', // Orange
    },
  ];

  constructor(
    @Inject(FOLDER_REPOSITORY)
    private readonly folderRepository: IFolderRepository,
  ) {}

  /**
   * Créer les dossiers par défaut pour un utilisateur
   * Cette méthode est idempotente : elle ne crée pas de doublons
   */
  async execute(userId: string): Promise<Folder[]> {
    try {
      this.logger.log(`Initializing default folders for user ${userId}`);

      // Vérifier si l'utilisateur a déjà des dossiers par défaut
      const existingDefaultFolders = await this.folderRepository.findDefaultFoldersByUserId(userId);

      if (existingDefaultFolders.length > 0) {
        this.logger.log(
          `User ${userId} already has ${existingDefaultFolders.length} default folders, skipping initialization`,
        );
        return existingDefaultFolders;
      }

      // Créer les dossiers par défaut
      const createdFolders: Folder[] = [];

      for (const folderConfig of this.DEFAULT_FOLDERS) {
        // Vérifier si un dossier avec ce nom existe déjà
        const existing = await this.folderRepository.findByNameAndUserId(folderConfig.name, userId);

        if (existing) {
          this.logger.warn(
            `Folder "${folderConfig.name}" already exists for user ${userId}, skipping`,
          );
          createdFolders.push(existing);
          continue;
        }

        // Créer le dossier par défaut
        const folder = Folder.createDefault(
          userId,
          folderConfig.name,
          folderConfig.icon,
          folderConfig.color,
        );

        const savedFolder = await this.folderRepository.save(folder);
        createdFolders.push(savedFolder);

        this.logger.log(`Created default folder "${folderConfig.name}" for user ${userId}`);
      }

      this.logger.log(
        `Successfully initialized ${createdFolders.length} default folders for user ${userId}`,
      );

      return createdFolders;
    } catch (error) {
      this.logger.error(
        `Failed to initialize default folders for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtenir la liste des noms de dossiers par défaut
   */
  getDefaultFolderNames(): string[] {
    return this.DEFAULT_FOLDERS.map(folder => folder.name);
  }
}
