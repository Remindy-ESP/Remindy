import apiClient from './client';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from './types';

/**
 * Category Service
 * Handles category CRUD operations
 */
class CategoryService {
  private readonly BASE_PATH = '/categories';

  /**
   * Get all categories (system + user categories)
   */
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(this.BASE_PATH);
    return response.data;
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`${this.BASE_PATH}/${id}`);
    return response.data;
  }

  /**
   * Create a new category
   */
  async create(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post<Category>(this.BASE_PATH, data);
    return response.data;
  }

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await apiClient.put<Category>(
      `${this.BASE_PATH}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a category (soft delete)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
  }
}

export const categoryService = new CategoryService();
export default categoryService;
