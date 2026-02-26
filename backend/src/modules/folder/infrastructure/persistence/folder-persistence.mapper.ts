import { Folder } from '../../domain/folder.entity';
import { FolderEntity } from './folder.entity';

/**
 * Mapper entre l'entité domaine Folder et l'entité TypeORM FolderEntity
 */
export class FolderPersistenceMapper {
  /**
   * Convertir une entité domaine en entité de persistence
   */
  static toPersistence(folder: Folder): FolderEntity {
    const entity = new FolderEntity();

    if (folder.id) {
      entity.id = folder.id;
    }

    entity.userId = folder.userId;
    entity.name = folder.name;
    entity.parentId = folder.parentId;
    entity.color = folder.color;
    entity.icon = folder.icon;
    entity.isDefault = folder.isDefault;

    if (folder.createdAt) {
      entity.createdAt = folder.createdAt;
    }

    if (folder.updatedAt) {
      entity.updatedAt = folder.updatedAt;
    }

    if (folder.deletedAt) {
      entity.deletedAt = folder.deletedAt;
    }

    return entity;
  }

  /**
   * Convertir une entité de persistence en entité domaine
   */
  static toDomain(entity: FolderEntity): Folder {
    return new Folder({
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      parentId: entity.parentId,
      color: entity.color,
      icon: entity.icon,
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  /**
   * Convertir un tableau d'entités de persistence en entités domaine
   */
  static toDomainArray(entities: FolderEntity[]): Folder[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convertir un tableau d'entités domaine en entités de persistence
   */
  static toPersistenceArray(folders: Folder[]): FolderEntity[] {
    return folders.map(folder => this.toPersistence(folder));
  }
}
