import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { ICategoryRepository } from '../ports/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../ports/category.repository.interface';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, userId?: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // System categories cannot be deleted
    if (!category.canBeDeleted()) {
      throw new ForbiddenException('System categories cannot be deleted');
    }

    // Users can only delete their own categories
    if (userId && !category.canBeModifiedBy(userId)) {
      throw new ForbiddenException('You can only delete your own categories');
    }

    const deleted = await this.categoryRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
