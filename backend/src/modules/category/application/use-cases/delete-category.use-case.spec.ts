import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteCategoryUseCase>(DeleteCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const categoryId = 'category-123';
    const userId = 'user-123';

    it('should successfully delete a category', async () => {
      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(category);
      repository.softDelete.mockResolvedValue(true);

      await useCase.execute(categoryId, userId);

      expect(repository.findById).toHaveBeenCalledWith(categoryId);
      expect(repository.softDelete).toHaveBeenCalledWith(categoryId);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(
        `Category with ID ${categoryId} not found`,
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to delete a system category', async () => {
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

      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(ForbiddenException);
      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(
        'System categories cannot be deleted',
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to delete another users category', async () => {
      const otherUsersCategory = new Category({
        id: categoryId,
        name: 'Other User Category',
        icon: 'icon',
        color: '#FF5733',
        userId: 'other-user-id',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(otherUsersCategory);

      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(ForbiddenException);
      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(
        'You can only delete your own categories',
      );
      expect(repository.softDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when softDelete fails', async () => {
      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(category);
      repository.softDelete.mockResolvedValue(false);

      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(categoryId, userId)).rejects.toThrow(
        `Category with ID ${categoryId} not found`,
      );
    });

    it('should allow deletion without userId parameter', async () => {
      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(category);
      repository.softDelete.mockResolvedValue(true);

      await useCase.execute(categoryId);

      expect(repository.softDelete).toHaveBeenCalledWith(categoryId);
    });
  });
});
