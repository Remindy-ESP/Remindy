import { categoryService } from '../category.service';
import apiClient from '../client';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types';

// Mock the API client
jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategory: Category = {
    id: 'cat1',
    name: 'Entertainment',
    icon: '🎬',
    color: '#ff0000',
    isSystem: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockCategories: Category[] = [
    mockCategory,
    {
      id: 'cat2',
      name: 'Utilities',
      icon: '⚡',
      color: '#00ff00',
      isSystem: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'cat3',
      name: 'Food',
      icon: '🍔',
      color: '#0000ff',
      isSystem: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('getAll', () => {
    it('fetches all categories', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCategories });

      const result = await categoryService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(3);
    });

    it('handles empty category list', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await categoryService.getAll();

      expect(result).toEqual([]);
    });

    it('handles network errors', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(categoryService.getAll()).rejects.toThrow('Network error');
    });

    it('returns categories with correct structure', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCategories });

      const result = await categoryService.getAll();

      result.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('color');
      });
    });
  });

  describe('getById', () => {
    it('fetches category by ID', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCategory });

      const result = await categoryService.getById('cat1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/categories/cat1');
      expect(result).toEqual(mockCategory);
    });

    it('handles not found error', async () => {
      const error = new Error('Category not found');
      mockApiClient.get.mockRejectedValue(error);

      await expect(categoryService.getById('invalid-id')).rejects.toThrow(
        'Category not found'
      );
    });

    it('returns category with all fields', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCategory });

      const result = await categoryService.getById('cat1');

      expect(result.id).toBe('cat1');
      expect(result.name).toBe('Entertainment');
      expect(result.icon).toBe('🎬');
      expect(result.color).toBe('#ff0000');
    });
  });

  describe('create', () => {
    it('creates a new category', async () => {
      const createData: CreateCategoryRequest = {
        name: 'New Category',
        icon: '🎮',
        color: '#ffff00',
      };

      const newCategory: Category = {
        id: 'cat4',
        ...createData,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newCategory });

      const result = await categoryService.create(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/categories', createData);
      expect(result).toEqual(newCategory);
      expect(result.name).toBe('New Category');
    });

    it('creates category with minimal data', async () => {
      const createData: CreateCategoryRequest = {
        name: 'Minimal',
        icon: '📝',
        color: '#000000',
      };

      const newCategory: Category = {
        id: 'cat5',
        ...createData,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newCategory });

      const result = await categoryService.create(createData);

      expect(result.name).toBe('Minimal');
      expect(result.icon).toBe('📝');
    });

    it('handles validation errors', async () => {
      const error = new Error('Validation failed: name is required');
      mockApiClient.post.mockRejectedValue(error);

      const createData: CreateCategoryRequest = {
        name: '',
        icon: '🎮',
        color: '#ffff00',
      };

      await expect(categoryService.create(createData)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('handles duplicate category name', async () => {
      const error = new Error('Category name already exists');
      mockApiClient.post.mockRejectedValue(error);

      const createData: CreateCategoryRequest = {
        name: 'Entertainment',
        icon: '🎮',
        color: '#ffff00',
      };

      await expect(categoryService.create(createData)).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('update', () => {
    it('updates a category', async () => {
      const updateData: UpdateCategoryRequest = {
        name: 'Updated Entertainment',
        color: '#ff00ff',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        ...updateData,
      };

      mockApiClient.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('cat1', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/categories/cat1',
        updateData
      );
      expect(result.name).toBe('Updated Entertainment');
      expect(result.color).toBe('#ff00ff');
    });

    it('updates only name', async () => {
      const updateData: UpdateCategoryRequest = {
        name: 'New Name',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        name: 'New Name',
      };

      mockApiClient.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('cat1', updateData);

      expect(result.name).toBe('New Name');
      expect(result.icon).toBe(mockCategory.icon);
    });

    it('updates only icon', async () => {
      const updateData: UpdateCategoryRequest = {
        icon: '🎯',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        icon: '🎯',
      };

      mockApiClient.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('cat1', updateData);

      expect(result.icon).toBe('🎯');
      expect(result.name).toBe(mockCategory.name);
    });

    it('updates only color', async () => {
      const updateData: UpdateCategoryRequest = {
        color: '#0000ff',
      };

      const updatedCategory: Category = {
        ...mockCategory,
        color: '#0000ff',
      };

      mockApiClient.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('cat1', updateData);

      expect(result.color).toBe('#0000ff');
    });

    it('handles not found error', async () => {
      const error = new Error('Category not found');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        categoryService.update('invalid-id', { name: 'Test' })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('delete', () => {
    it('deletes a category', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await categoryService.delete('cat1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/categories/cat1');
    });

    it('handles not found error', async () => {
      const error = new Error('Category not found');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(categoryService.delete('invalid-id')).rejects.toThrow(
        'Category not found'
      );
    });

    it('handles category in use error', async () => {
      const error = new Error('Cannot delete category that is in use');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(categoryService.delete('cat1')).rejects.toThrow(
        'in use'
      );
    });

    it('successfully deletes multiple categories', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await categoryService.delete('cat1');
      await categoryService.delete('cat2');
      await categoryService.delete('cat3');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const error = new Error('Network connection failed');
      mockApiClient.get.mockRejectedValue(error);

      await expect(categoryService.getAll()).rejects.toThrow(
        'Network connection failed'
      );
    });

    it('handles timeout errors', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(categoryService.getById('cat1')).rejects.toThrow(
        'Request timeout'
      );
    });

    it('handles unauthorized errors', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        categoryService.create({
          name: 'Test',
          icon: '🎮',
          color: '#000000',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('handles server errors', async () => {
      const error = new Error('Internal server error');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        categoryService.update('cat1', { name: 'Test' })
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('Data Validation', () => {
    it('creates category with valid color format', async () => {
      const createData: CreateCategoryRequest = {
        name: 'Test',
        icon: '🎮',
        color: '#ff0000',
      };

      const newCategory: Category = {
        id: 'cat4',
        ...createData,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newCategory });

      const result = await categoryService.create(createData);

      expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('creates category with emoji icon', async () => {
      const createData: CreateCategoryRequest = {
        name: 'Test',
        icon: '🎮',
        color: '#ff0000',
      };

      const newCategory: Category = {
        id: 'cat4',
        ...createData,
        isSystem: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newCategory });

      const result = await categoryService.create(createData);

      expect(result.icon).toBe('🎮');
    });
  });
});
