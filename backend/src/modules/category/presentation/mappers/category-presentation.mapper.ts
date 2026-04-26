import { Category } from '../../domain/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryFilterDto } from '../dto/category-filter.dto';
import { CreateCategoryAppDto } from '../../application/dto/create-category-app.dto';
import { UpdateCategoryAppDto } from '../../application/dto/update-category-app.dto';
import { CategoryFilterAppDto } from '../../application/dto/category-filter-app.dto';

export class CategoryPresentationMapper {
  static toCreateAppDto(dto: CreateCategoryDto): CreateCategoryAppDto {
    return {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
      userId: dto.userId,
      isSystem: false,
    };
  }

  static toUpdateAppDto(dto: UpdateCategoryDto): UpdateCategoryAppDto {
    return {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
    };
  }

  static toFilterAppDto(dto: CategoryFilterDto): CategoryFilterAppDto {
    return {
      userId: dto.userId,
      name: dto.name,
      isSystem: dto.isSystem,
    };
  }

  static toResponseDto(category: Category): CategoryResponseDto {
    const response = new CategoryResponseDto();
    response.id = category.id!;
    response.name = category.name;
    response.icon = category.icon;
    response.color = category.color;
    response.userId = category.userId ?? null;
    response.isSystem = category.isSystem;
    response.createdAt = category.createdAt!;
    response.updatedAt = category.updatedAt!;
    return response;
  }

  static toResponseDtoArray(categories: Category[]): CategoryResponseDto[] {
    return categories.map(category => this.toResponseDto(category));
  }
}
