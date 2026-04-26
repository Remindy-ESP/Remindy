import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../ports/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';

@Injectable()
export class FindCategoryByIdUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }
}
