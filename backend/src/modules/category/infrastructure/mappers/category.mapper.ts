import { Category } from '../../domain/category.entity';
import { CategoryEntity } from '../persistence/category.entity';

export class CategoryMapper {
  static toDomain(entity: CategoryEntity): Category {
    return new Category({
      id: entity.id,
      name: entity.name,
      icon: entity.icon,
      color: entity.color,
      userId: entity.userId,
      isSystem: entity.isSystem,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? undefined,
    });
  }

  static toPersistence(domain: Category): CategoryEntity {
    const entity = new CategoryEntity();

    if (domain.id) {
      entity.id = domain.id;
    }

    entity.name = domain.name;
    entity.icon = domain.icon;
    entity.color = domain.color;
    entity.userId = domain.userId ?? null;
    entity.isSystem = domain.isSystem;

    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }
    if (domain.deletedAt) {
      entity.deletedAt = domain.deletedAt;
    }

    return entity;
  }

  static toDomainArray(entities: CategoryEntity[]): Category[] {
    return entities.map(entity => this.toDomain(entity));
  }
}
