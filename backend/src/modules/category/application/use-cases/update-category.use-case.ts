import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { ICategoryRepository } from '../ports/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';
import { UpdateCategoryAppDto } from '../dto/update-category-app.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateCategoryAppDto, userId?: string): Promise<Category> {
    const existingCategory = await this.categoryRepository.findById(id);

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // System categories cannot be modified
    if (existingCategory.isSystemCategory()) {
      throw new ForbiddenException('System categories cannot be modified');
    }

    // Users can only modify their own categories
    if (userId && !existingCategory.canBeModifiedBy(userId)) {
      throw new ForbiddenException('You can only modify your own categories');
    }

    // Apply updates
    if (dto.name !== undefined) {
      existingCategory.updateName(dto.name);
    }

    if (dto.icon !== undefined) {
      existingCategory.updateIcon(dto.icon);
    }

    if (dto.color !== undefined) {
      existingCategory.updateColor(dto.color);
    }

    const updatedCategory = await this.categoryRepository.update(id, existingCategory);

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory;
  }
}
