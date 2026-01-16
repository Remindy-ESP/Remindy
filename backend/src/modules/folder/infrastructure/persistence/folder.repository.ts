import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import type { IFolderRepository } from '../../application/ports/folder-repository.interface';
import { Folder } from '../../domain/folder.entity';
import { FolderEntity } from './folder.entity';
import { FolderPersistenceMapper } from './folder-persistence.mapper';

/**
 * Folder Repository Implementation (TypeORM)
 * Implémente l'interface IFolderRepository
 */
@Injectable()
export class FolderRepository implements IFolderRepository {
  private readonly logger = new Logger(FolderRepository.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folderEntityRepository: Repository<FolderEntity>,
  ) {}

  async save(folder: Folder): Promise<Folder> {
    try {
      const folderEntity = FolderPersistenceMapper.toPersistence(folder);
      const savedEntity = await this.folderEntityRepository.save(folderEntity);
      return FolderPersistenceMapper.toDomain(savedEntity);
    } catch (error) {
      this.logger.error(`Failed to save folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Folder | null> {
    try {
      const folderEntity = await this.folderEntityRepository.findOne({
        where: { id },
      });

      if (!folderEntity) {
        return null;
      }

      return FolderPersistenceMapper.toDomain(folderEntity);
    } catch (error) {
      this.logger.error(`Failed to find folder by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUserId(userId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    try {
      const queryBuilder = this.folderEntityRepository
        .createQueryBuilder('folder')
        .where('folder.user_id = :userId', { userId })
        .orderBy('folder.name', 'ASC');

      if (!includeDeleted) {
        queryBuilder.andWhere('folder.deleted_at IS NULL');
      }

      const folderEntities = await queryBuilder.getMany();

      return folderEntities.map(entity => FolderPersistenceMapper.toDomain(entity));
    } catch (error) {
      this.logger.error(`Failed to find folders by user ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findRootFoldersByUserId(userId: string): Promise<Folder[]> {
    try {
      const folderEntities = await this.folderEntityRepository.find({
        where: {
          userId,
          parentId: IsNull(),
          deletedAt: IsNull(),
        },
        order: {
          name: 'ASC',
        },
      });

      return folderEntities.map(entity => FolderPersistenceMapper.toDomain(entity));
    } catch (error) {
      this.logger.error(`Failed to find root folders: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findSubfolders(parentId: string): Promise<Folder[]> {
    try {
      const folderEntities = await this.folderEntityRepository.find({
        where: {
          parentId,
          deletedAt: IsNull(),
        },
        order: {
          name: 'ASC',
        },
      });

      return folderEntities.map(entity => FolderPersistenceMapper.toDomain(entity));
    } catch (error) {
      this.logger.error(`Failed to find subfolders: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByNameAndUserId(name: string, userId: string): Promise<Folder | null> {
    try {
      // Case-insensitive search using LOWER()
      const folderEntity = await this.folderEntityRepository
        .createQueryBuilder('folder')
        .where('LOWER(folder.name) = LOWER(:name)', { name })
        .andWhere('folder.user_id = :userId', { userId })
        .andWhere('folder.deleted_at IS NULL')
        .getOne();

      if (!folderEntity) {
        return null;
      }

      return FolderPersistenceMapper.toDomain(folderEntity);
    } catch (error) {
      this.logger.error(`Failed to find folder by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findDefaultFoldersByUserId(userId: string): Promise<Folder[]> {
    try {
      const folderEntities = await this.folderEntityRepository.find({
        where: {
          userId,
          isDefault: true,
          deletedAt: IsNull(),
        },
        order: {
          name: 'ASC',
        },
      });

      return folderEntities.map(entity => FolderPersistenceMapper.toDomain(entity));
    } catch (error) {
      this.logger.error(`Failed to find default folders: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.folderEntityRepository.delete(id);
      this.logger.log(`Folder ${id} hard deleted`);
    } catch (error) {
      this.logger.error(`Failed to delete folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.folderEntityRepository.softDelete(id);
      this.logger.log(`Folder ${id} soft deleted`);
    } catch (error) {
      this.logger.error(`Failed to soft delete folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await this.folderEntityRepository.restore(id);
      this.logger.log(`Folder ${id} restored`);
    } catch (error) {
      this.logger.error(`Failed to restore folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  async countDocumentsInFolder(folderId: string): Promise<number> {
    try {
      const result = await this.folderEntityRepository
        .createQueryBuilder('folder')
        .leftJoin('folder.documents', 'document')
        .where('folder.id = :folderId', { folderId })
        .andWhere('document.deleted_at IS NULL')
        .select('COUNT(document.id)', 'count')
        .getRawOne();

      return parseInt(result?.count || '0', 10);
    } catch (error) {
      this.logger.error(`Failed to count documents in folder: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.folderEntityRepository.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check folder existence: ${error.message}`, error.stack);
      throw error;
    }
  }

  async belongsToUser(folderId: string, userId: string): Promise<boolean> {
    try {
      const count = await this.folderEntityRepository.count({
        where: {
          id: folderId,
          userId,
        },
      });

      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check folder ownership: ${error.message}`, error.stack);
      throw error;
    }
  }

  async moveDocumentsToFolder(fromFolderId: string, toFolderId: string | null): Promise<void> {
    try {
      await this.folderEntityRepository.manager.query(
        `UPDATE documents SET folder_id = $1 WHERE folder_id = $2 AND deleted_at IS NULL`,
        [toFolderId, fromFolderId]
      );
      this.logger.log(`Moved documents from folder ${fromFolderId} to ${toFolderId || 'root'}`);
    } catch (error) {
      this.logger.error(`Failed to move documents: ${error.message}`, error.stack);
      throw error;
    }
  }
}
