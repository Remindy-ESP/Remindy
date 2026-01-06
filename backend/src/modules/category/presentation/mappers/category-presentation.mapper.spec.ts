import { CategoryPresentationMapper } from './category-presentation.mapper';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryFilterDto } from '../dto/category-filter.dto';
import { Category } from '../../domain/category.entity';

describe('CategoryPresentationMapper', () => {
  describe('toCreateAppDto', () => {
    it('should map CreateCategoryDto to CreateCategoryAppDto', () => {
      const dto: CreateCategoryDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      };

      const result = CategoryPresentationMapper.toCreateAppDto(dto);

      expect(result.name).toBe(dto.name);
      expect(result.icon).toBe(dto.icon);
      expect(result.color).toBe(dto.color);
      expect(result.isSystem).toBe(false);
    });

    it('should always set isSystem to false', () => {
      const dto: CreateCategoryDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      };

      const result = CategoryPresentationMapper.toCreateAppDto(dto);

      expect(result.isSystem).toBe(false);
    });

    it('should include userId if present in dto', () => {
      const dto: any = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
      };

      const result = CategoryPresentationMapper.toCreateAppDto(dto);

      expect(result.userId).toBe('user-123');
    });
  });

  describe('toUpdateAppDto', () => {
    it('should map UpdateCategoryDto to UpdateCategoryAppDto', () => {
      const dto: UpdateCategoryDto = {
        name: 'Updated Work',
        icon: 'briefcase-new',
        color: '#3366FF',
      };

      const result = CategoryPresentationMapper.toUpdateAppDto(dto);

      expect(result.name).toBe(dto.name);
      expect(result.icon).toBe(dto.icon);
      expect(result.color).toBe(dto.color);
    });

    it('should map with partial data', () => {
      const dto: UpdateCategoryDto = {
        name: 'Updated Name',
      };

      const result = CategoryPresentationMapper.toUpdateAppDto(dto);

      expect(result.name).toBe(dto.name);
      expect(result.icon).toBeUndefined();
      expect(result.color).toBeUndefined();
    });

    it('should handle empty dto', () => {
      const dto: UpdateCategoryDto = {};

      const result = CategoryPresentationMapper.toUpdateAppDto(dto);

      expect(result.name).toBeUndefined();
      expect(result.icon).toBeUndefined();
      expect(result.color).toBeUndefined();
    });
  });

  describe('toFilterAppDto', () => {
    it('should map CategoryFilterDto to CategoryFilterAppDto', () => {
      const dto: CategoryFilterDto = {
        userId: 'user-123',
        name: 'Work',
        isSystem: false,
      };

      const result = CategoryPresentationMapper.toFilterAppDto(dto);

      expect(result.userId).toBe(dto.userId);
      expect(result.name).toBe(dto.name);
      expect(result.isSystem).toBe(dto.isSystem);
    });

    it('should handle partial filters', () => {
      const dto: CategoryFilterDto = {
        userId: 'user-123',
      };

      const result = CategoryPresentationMapper.toFilterAppDto(dto);

      expect(result.userId).toBe('user-123');
      expect(result.name).toBeUndefined();
      expect(result.isSystem).toBeUndefined();
    });

    it('should handle empty filters', () => {
      const dto: CategoryFilterDto = {};

      const result = CategoryPresentationMapper.toFilterAppDto(dto);

      expect(result.userId).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.isSystem).toBeUndefined();
    });
  });

  describe('toResponseDto', () => {
    it('should map Category to CategoryResponseDto', () => {
      const category = new Category({
        id: 'cat-123',
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });

      const result = CategoryPresentationMapper.toResponseDto(category);

      expect(result.id).toBe(category.id);
      expect(result.name).toBe(category.name);
      expect(result.icon).toBe(category.icon);
      expect(result.color).toBe(category.color);
      expect(result.userId).toBe(category.userId);
      expect(result.isSystem).toBe(category.isSystem);
      expect(result.createdAt).toBe(category.createdAt);
      expect(result.updatedAt).toBe(category.updatedAt);
    });

    it('should map system category', () => {
      const category = new Category({
        id: 'cat-sys',
        name: 'System Category',
        icon: 'system',
        color: '#FF5733',
        userId: null,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = CategoryPresentationMapper.toResponseDto(category);

      expect(result.isSystem).toBe(true);
      expect(result.userId).toBeNull();
    });

    it('should handle category with undefined userId', () => {
      const category = new Category({
        id: 'cat-123',
        name: 'Category',
        icon: 'icon',
        color: '#FF5733',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = CategoryPresentationMapper.toResponseDto(category);

      expect(result.userId).toBeNull();
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Category to array of CategoryResponseDto', () => {
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

      const result = CategoryPresentationMapper.toResponseDtoArray(categories);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[1].id).toBe('cat-2');
      expect(result[0].name).toBe('Work');
      expect(result[1].name).toBe('Personal');
    });

    it('should handle empty array', () => {
      const result = CategoryPresentationMapper.toResponseDtoArray([]);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should map mixed system and user categories', () => {
      const categories = [
        new Category({
          id: 'cat-sys',
          name: 'System',
          icon: 'system',
          color: '#FF5733',
          userId: null,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Category({
          id: 'cat-user',
          name: 'User',
          icon: 'user',
          color: '#3366FF',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const result = CategoryPresentationMapper.toResponseDtoArray(categories);

      expect(result[0].isSystem).toBe(true);
      expect(result[1].isSystem).toBe(false);
    });
  });
});
