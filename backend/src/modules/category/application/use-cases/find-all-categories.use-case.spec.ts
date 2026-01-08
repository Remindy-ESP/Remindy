import { Test, TestingModule } from '@nestjs/testing';
import { FindAllCategoriesUseCase } from './find-all-categories.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { CategoryFilterAppDto } from '../dto/category-filter-app.dto';
import { Category } from '../../domain/category.entity';

describe('FindAllCategoriesUseCase', () => {
  let useCase: FindAllCategoriesUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllCategoriesUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllCategoriesUseCase>(FindAllCategoriesUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all categories without filters', async () => {
      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Category({
          id: 'cat-2',
          name: 'Personal',
          icon: 'user',
          color: '#3366FF',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(categories);

      const result = await useCase.execute();

      expect(result).toBe(categories);
      expect(result).toHaveLength(2);
      expect(repository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return categories filtered by userId', async () => {
      const userId = 'user-123';
      const filters: CategoryFilterAppDto = { userId };

      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: userId,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(categories);

      const result = await useCase.execute(filters);

      expect(result).toBe(categories);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return categories filtered by name', async () => {
      const filters: CategoryFilterAppDto = { name: 'Work' };

      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(categories);

      const result = await useCase.execute(filters);

      expect(result).toBe(categories);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return only system categories when isSystem filter is true', async () => {
      const filters: CategoryFilterAppDto = { isSystem: true };

      const systemCategories = [
        new Category({
          id: 'cat-sys-1',
          name: 'System Category 1',
          icon: 'system1',
          color: '#FF5733',
          userId: null,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Category({
          id: 'cat-sys-2',
          name: 'System Category 2',
          icon: 'system2',
          color: '#3366FF',
          userId: null,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(systemCategories);

      const result = await useCase.execute(filters);

      expect(result).toBe(systemCategories);
      expect(result.every(cat => cat.isSystem)).toBe(true);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return only user categories when isSystem filter is false', async () => {
      const filters: CategoryFilterAppDto = { isSystem: false };

      const userCategories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(userCategories);

      const result = await useCase.execute(filters);

      expect(result).toBe(userCategories);
      expect(result.every(cat => !cat.isSystem)).toBe(true);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return categories with multiple filters', async () => {
      const filters: CategoryFilterAppDto = {
        userId: 'user-123',
        name: 'Work',
        isSystem: false,
      };

      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(categories);

      const result = await useCase.execute(filters);

      expect(result).toBe(categories);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no categories found', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle partial name matching', async () => {
      const filters: CategoryFilterAppDto = { name: 'Wor' };

      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue(categories);

      const result = await useCase.execute(filters);

      expect(result).toBe(categories);
    });
  });
});
