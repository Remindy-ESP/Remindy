import { CategoryMapper } from './category.mapper';
import { Category } from '../../domain/category.entity';
import { CategoryEntity } from '../persistence/category.entity';

describe('CategoryMapper', () => {
  describe('toDomain', () => {
    it('should map CategoryEntity to Category domain entity', () => {
      const entity = new CategoryEntity();
      entity.id = 'cat-123';
      entity.name = 'Work';
      entity.icon = 'briefcase';
      entity.color = '#FF5733';
      entity.userId = 'user-123';
      entity.isSystem = false;
      entity.createdAt = new Date('2024-01-01');
      entity.updatedAt = new Date('2024-01-02');
      entity.deletedAt = null;

      const domain = CategoryMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Category);
      expect(domain.id).toBe(entity.id);
      expect(domain.name).toBe(entity.name);
      expect(domain.icon).toBe(entity.icon);
      expect(domain.color).toBe(entity.color);
      expect(domain.userId).toBe(entity.userId);
      expect(domain.isSystem).toBe(entity.isSystem);
      expect(domain.createdAt).toBe(entity.createdAt);
      expect(domain.updatedAt).toBe(entity.updatedAt);
      expect(domain.deletedAt).toBeUndefined();
    });

    it('should map system category to domain', () => {
      const entity = new CategoryEntity();
      entity.id = 'cat-sys-1';
      entity.name = 'System Category';
      entity.icon = 'system';
      entity.color = '#FF5733';
      entity.userId = null;
      entity.isSystem = true;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;

      const domain = CategoryMapper.toDomain(entity);

      expect(domain.isSystem).toBe(true);
      expect(domain.userId).toBeNull();
    });

    it('should handle deletedAt when present', () => {
      const entity = new CategoryEntity();
      entity.id = 'cat-123';
      entity.name = 'Deleted Category';
      entity.icon = 'trash';
      entity.color = '#FF5733';
      entity.userId = 'user-123';
      entity.isSystem = false;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = new Date('2024-01-03');

      const domain = CategoryMapper.toDomain(entity);

      expect(domain.deletedAt).toBe(entity.deletedAt);
    });
  });

  describe('toPersistence', () => {
    it('should map Category domain entity to CategoryEntity', () => {
      const domain = new Category({
        id: 'cat-123',
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const entity = CategoryMapper.toPersistence(domain);

      expect(entity).toBeInstanceOf(CategoryEntity);
      expect(entity.id).toBe(domain.id);
      expect(entity.name).toBe(domain.name);
      expect(entity.icon).toBe(domain.icon);
      expect(entity.color).toBe(domain.color);
      expect(entity.userId).toBe(domain.userId);
      expect(entity.isSystem).toBe(domain.isSystem);
      expect(entity.createdAt).toBe(domain.createdAt);
      expect(entity.updatedAt).toBe(domain.updatedAt);
    });

    it('should map domain without id', () => {
      const domain = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      const entity = CategoryMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.name).toBe(domain.name);
    });

    it('should convert undefined userId to null', () => {
      const domain = new Category({
        name: 'System Category',
        icon: 'system',
        color: '#FF5733',
        isSystem: true,
      });

      const entity = CategoryMapper.toPersistence(domain);

      expect(entity.userId).toBeNull();
    });

    it('should map deletedAt when present', () => {
      const deletedDate = new Date('2024-01-03');
      const domain = new Category({
        id: 'cat-123',
        name: 'Deleted Category',
        icon: 'trash',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: deletedDate,
      });

      const entity = CategoryMapper.toPersistence(domain);

      expect(entity.deletedAt).toBe(deletedDate);
    });

    it('should not set timestamps when not present in domain', () => {
      const domain = new Category({
        name: 'New Category',
        icon: 'new',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      const entity = CategoryMapper.toPersistence(domain);

      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
      expect(entity.deletedAt).toBeUndefined();
    });
  });

  describe('toDomainArray', () => {
    it('should map array of CategoryEntity to array of Category', () => {
      const entities = [
        Object.assign(new CategoryEntity(), {
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        Object.assign(new CategoryEntity(), {
          id: 'cat-2',
          name: 'Personal',
          icon: 'user',
          color: '#3366FF',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      const domains = CategoryMapper.toDomainArray(entities);

      expect(domains).toHaveLength(2);
      expect(domains[0]).toBeInstanceOf(Category);
      expect(domains[1]).toBeInstanceOf(Category);
      expect(domains[0].id).toBe('cat-1');
      expect(domains[1].id).toBe('cat-2');
    });

    it('should handle empty array', () => {
      const domains = CategoryMapper.toDomainArray([]);

      expect(domains).toEqual([]);
      expect(domains).toHaveLength(0);
    });

    it('should map mixed system and user categories', () => {
      const entities = [
        Object.assign(new CategoryEntity(), {
          id: 'cat-sys',
          name: 'System',
          icon: 'system',
          color: '#FF5733',
          userId: null,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        Object.assign(new CategoryEntity(), {
          id: 'cat-user',
          name: 'User',
          icon: 'user',
          color: '#3366FF',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      const domains = CategoryMapper.toDomainArray(entities);

      expect(domains[0].isSystem).toBe(true);
      expect(domains[1].isSystem).toBe(false);
    });
  });
});
