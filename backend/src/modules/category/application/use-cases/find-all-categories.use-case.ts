import { Injectable, Inject } from '@nestjs/common';
import type { ICategoryRepository } from '../ports/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';
import { CategoryFilterAppDto } from '../dto/category-filter-app.dto';

@Injectable()
export class FindAllCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(filters?: CategoryFilterAppDto): Promise<Category[]> {
    return await this.categoryRepository.findAll(filters);
  }
}
