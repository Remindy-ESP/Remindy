import { Injectable, Inject } from '@nestjs/common';
import type { ICategoryRepository } from '../ports/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { Category } from '../../domain/category.entity';
import { CreateCategoryAppDto } from '../dto/create-category-app.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: CreateCategoryAppDto): Promise<Category> {
    const category = new Category({
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      userId: dto.userId,
      isSystem: dto.isSystem ?? false,
    });

    return await this.categoryRepository.create(category);
  }
}
