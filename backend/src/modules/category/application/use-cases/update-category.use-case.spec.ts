import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateCategoryUseCase } from './update-category.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { UpdateCategoryAppDto } from '../dto/update-category-app.dto';
import { Category } from '../../domain/category.entity';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCategoryUseCase>(UpdateCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const categoryId = 'category-123';
    const userId = 'user-123';
    const updateDto: UpdateCategoryAppDto = {
      name: 'Updated Work',
      icon: 'briefcase-updated',
      color: '#3366FF',
    };

    it('should successfully update a category', async () => {
      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedCategory = new Category({
        id: categoryId,
        name: updateDto.name!,
        icon: updateDto.icon!,
        color: updateDto.color!,
        userId: userId,
        isSystem: false,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(updatedCategory);

      const result = await useCase.execute(categoryId, updateDto, userId);

      expect(result).toBe(updatedCategory);
      expect(repository.findById).toHaveBeenCalledWith(categoryId);
      expect(repository.update).toHaveBeenCalledWith(categoryId, existingCategory);
    });

    it('should update only the name when only name is provided', async () => {
      const partialDto: UpdateCategoryAppDto = {
        name: 'New Name',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Old Name',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedCategory = new Category({
        id: categoryId,
        name: partialDto.name!,
        icon: existingCategory.icon,
        color: existingCategory.color,
        userId: userId,
        isSystem: false,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(updatedCategory);

      const result = await useCase.execute(categoryId, partialDto, userId);

      expect(result.name).toBe(partialDto.name);
      expect(result.icon).toBe(existingCategory.icon);
      expect(result.color).toBe(existingCategory.color);
    });

    it('should update only the icon when only icon is provided', async () => {
      const partialDto: UpdateCategoryAppDto = {
        icon: 'new-icon',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'old-icon',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedCategory = new Category({
        id: categoryId,
        name: existingCategory.name,
        icon: partialDto.icon!,
        color: existingCategory.color,
        userId: userId,
        isSystem: false,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(updatedCategory);

      const result = await useCase.execute(categoryId, partialDto, userId);

      expect(result.icon).toBe(partialDto.icon);
      expect(result.name).toBe(existingCategory.name);
      expect(result.color).toBe(existingCategory.color);
    });

    it('should update only the color when only color is provided', async () => {
      const partialDto: UpdateCategoryAppDto = {
        color: '#AABBCC',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedCategory = new Category({
        id: categoryId,
        name: existingCategory.name,
        icon: existingCategory.icon,
        color: partialDto.color!,
        userId: userId,
        isSystem: false,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(updatedCategory);

      const result = await useCase.execute(categoryId, partialDto, userId);

      expect(result.color).toBe(partialDto.color);
      expect(result.name).toBe(existingCategory.name);
      expect(result.icon).toBe(existingCategory.icon);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        `Category with ID ${categoryId} not found`,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to update a system category', async () => {
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

      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        'System categories cannot be modified',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to update another users category', async () => {
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

      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        'You can only modify your own categories',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when update returns null', async () => {
      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(null);

      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(categoryId, updateDto, userId)).rejects.toThrow(
        `Category with ID ${categoryId} not found`,
      );
    });

    it('should allow update without userId parameter', async () => {
      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedCategory = new Category({
        id: categoryId,
        name: updateDto.name!,
        icon: updateDto.icon!,
        color: updateDto.color!,
        userId: userId,
        isSystem: false,
        createdAt: existingCategory.createdAt,
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);
      repository.update.mockResolvedValue(updatedCategory);

      const result = await useCase.execute(categoryId, updateDto);

      expect(result).toBe(updatedCategory);
    });

    it('should throw error when updated name is empty', async () => {
      const invalidDto: UpdateCategoryAppDto = {
        name: '',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);

      await expect(useCase.execute(categoryId, invalidDto, userId)).rejects.toThrow(
        'Category name cannot be empty',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when updated icon is empty', async () => {
      const invalidDto: UpdateCategoryAppDto = {
        icon: '',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);

      await expect(useCase.execute(categoryId, invalidDto, userId)).rejects.toThrow(
        'Category icon cannot be empty',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw error when updated color is invalid', async () => {
      const invalidDto: UpdateCategoryAppDto = {
        color: 'invalid',
      };

      const existingCategory = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findById.mockResolvedValue(existingCategory);

      await expect(useCase.execute(categoryId, invalidDto, userId)).rejects.toThrow(
        'Color must be a valid HEX color code',
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
