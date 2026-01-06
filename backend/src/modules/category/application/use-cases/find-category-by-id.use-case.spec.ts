import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindCategoryByIdUseCase } from './find-category-by-id.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';

describe('FindCategoryByIdUseCase', () => {
  let useCase: FindCategoryByIdUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCategoryByIdUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindCategoryByIdUseCase>(FindCategoryByIdUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const categoryId = 'category-123';

    it('should successfully find a category by id', async () => {
      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(category);

      const result = await useCase.execute(categoryId);

      expect(result).toBe(category);
      expect(repository.findById).toHaveBeenCalledWith(categoryId);
      expect(repository.findById).toHaveBeenCalledTimes(1);
    });

    it('should find a system category', async () => {
      const systemCategory = new Category({
        id: categoryId,
        name: 'System Category',
        icon: 'system',
        color: '#FF5733',
        userId: null,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(systemCategory);

      const result = await useCase.execute(categoryId);

      expect(result).toBe(systemCategory);
      expect(result.isSystem).toBe(true);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(categoryId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(categoryId)).rejects.toThrow(`Category with ID ${categoryId} not found`);
    });

    it('should return category with all fields', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });

      repository.findById.mockResolvedValue(category);

      const result = await useCase.execute(categoryId);

      expect(result.id).toBe(categoryId);
      expect(result.name).toBe('Work');
      expect(result.icon).toBe('briefcase');
      expect(result.color).toBe('#FF5733');
      expect(result.userId).toBe('user-123');
      expect(result.isSystem).toBe(false);
      expect(result.createdAt).toBe(createdAt);
      expect(result.updatedAt).toBe(updatedAt);
    });
  });
});
