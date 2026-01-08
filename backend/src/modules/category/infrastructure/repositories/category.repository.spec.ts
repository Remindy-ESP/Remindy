import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CategoryRepository } from './category.repository';
import { CategoryEntity } from '../persistence/category.entity';
import { Category } from '../../domain/category.entity';
import { CategoryFilterAppDto } from '../../application/dto/category-filter-app.dto';

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let typeOrmRepository: jest.Mocked<Repository<CategoryEntity>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<CategoryEntity>>;

  beforeEach(async () => {
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    } as any;

    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryRepository,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
    typeOrmRepository = module.get(getRepositoryToken(CategoryEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new category', async () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      const savedEntity = new CategoryEntity();
      savedEntity.id = 'cat-123';
      savedEntity.name = category.name;
      savedEntity.icon = category.icon;
      savedEntity.color = category.color;
      savedEntity.userId = category.userId;
      savedEntity.isSystem = category.isSystem;
      savedEntity.createdAt = new Date();
      savedEntity.updatedAt = new Date();
      savedEntity.deletedAt = null;

      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.create(category);

      expect(result).toBeInstanceOf(Category);
      expect(result.id).toBe('cat-123');
      expect(result.name).toBe(category.name);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find and return a category by id', async () => {
      const entity = new CategoryEntity();
      entity.id = 'cat-123';
      entity.name = 'Work';
      entity.icon = 'briefcase';
      entity.color = '#FF5733';
      entity.userId = 'user-123';
      entity.isSystem = false;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;

      typeOrmRepository.findOne.mockResolvedValue(entity);

      const result = await repository.findById('cat-123');

      expect(result).toBeInstanceOf(Category);
      expect(result?.id).toBe('cat-123');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
      });
    });

    it('should return null when category not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all categories without filters', async () => {
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
      ];

      queryBuilder.getMany.mockResolvedValue(entities);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Category);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.isSystem', 'DESC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
    });

    it('should filter by userId', async () => {
      const filters: CategoryFilterAppDto = { userId: 'user-123' };
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
      ];

      queryBuilder.getMany.mockResolvedValue(entities);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(category.userId = :userId OR category.isSystem = true)',
        { userId: 'user-123' }
      );
    });

    it('should filter by null userId', async () => {
      const filters: CategoryFilterAppDto = { userId: null as any };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('category.userId IS NULL');
    });

    it('should filter by name', async () => {
      const filters: CategoryFilterAppDto = { name: 'Work' };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('category.name ILIKE :name', {
        name: '%Work%',
      });
    });

    it('should filter by isSystem true', async () => {
      const filters: CategoryFilterAppDto = { isSystem: true };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('category.isSystem = :isSystem', {
        isSystem: true,
      });
    });

    it('should filter by isSystem false', async () => {
      const filters: CategoryFilterAppDto = { isSystem: false };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('category.isSystem = :isSystem', {
        isSystem: false,
      });
    });

    it('should apply multiple filters', async () => {
      const filters: CategoryFilterAppDto = {
        userId: 'user-123',
        name: 'Work',
        isSystem: false,
      };

      queryBuilder.getMany.mockResolvedValue([]);

      await repository.findAll(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('update', () => {
    it('should update and return the category', async () => {
      const existingEntity = new CategoryEntity();
      existingEntity.id = 'cat-123';
      existingEntity.name = 'Work';
      existingEntity.icon = 'briefcase';
      existingEntity.color = '#FF5733';
      existingEntity.userId = 'user-123';
      existingEntity.isSystem = false;
      existingEntity.createdAt = new Date();
      existingEntity.updatedAt = new Date();
      existingEntity.deletedAt = null;

      const updatedCategory = new Category({
        id: 'cat-123',
        name: 'Updated Work',
        icon: 'briefcase-new',
        color: '#3366FF',
        userId: 'user-123',
        isSystem: false,
        createdAt: existingEntity.createdAt,
        updatedAt: new Date(),
      });

      const savedEntity = Object.assign(new CategoryEntity(), {
        ...existingEntity,
        name: updatedCategory.name,
        icon: updatedCategory.icon,
        color: updatedCategory.color,
        updatedAt: updatedCategory.updatedAt,
      });

      typeOrmRepository.findOne.mockResolvedValue(existingEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);

      const result = await repository.update('cat-123', updatedCategory);

      expect(result).toBeInstanceOf(Category);
      expect(result?.name).toBe('Updated Work');
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 'cat-123' } });
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null when category not found', async () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', category);

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a category and return true', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await repository.delete('cat-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.delete).toHaveBeenCalledWith('cat-123');
    });

    it('should return false when category not found', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.delete.mockResolvedValue({ affected: undefined, raw: {} });

      const result = await repository.delete('cat-123');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a category and return true', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await repository.softDelete('cat-123');

      expect(result).toBe(true);
      expect(typeOrmRepository.softDelete).toHaveBeenCalledWith('cat-123');
    });

    it('should return false when category not found', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: 0, raw: {}, generatedMaps: [] });

      const result = await repository.softDelete('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when affected is undefined', async () => {
      typeOrmRepository.softDelete.mockResolvedValue({ affected: undefined, raw: {}, generatedMaps: [] });

      const result = await repository.softDelete('cat-123');

      expect(result).toBe(false);
    });
  });
});
