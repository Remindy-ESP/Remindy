import { Category } from '../../domain/category.entity';
import { CategoryFilterAppDto } from '../dto/category-filter-app.dto';

export interface ICategoryRepository {
  create(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findAll(filters?: CategoryFilterAppDto): Promise<Category[]>;
  update(id: string, category: Category): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');
