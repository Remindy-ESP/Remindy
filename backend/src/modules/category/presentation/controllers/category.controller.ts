import { Controller, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryFilterDto } from '../dto/category-filter.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { FindCategoryByIdUseCase } from '../../application/use-cases/find-category-by-id.use-case';
import { FindAllCategoriesUseCase } from '../../application/use-cases/find-all-categories.use-case';
import { CategoryPresentationMapper } from '../mappers/category-presentation.mapper';
import {
  ApiCategoryCreate,
  ApiCategoryFindAll,
  ApiCategoryFindById,
  ApiCategoryUpdate,
  ApiCategoryDelete,
} from '../../../../swagger/decorators/api-category.decorator';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
@UseGuards(ThrottlerGuard)
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase,
    private readonly findAllCategoriesUseCase: FindAllCategoriesUseCase,
  ) {}

  @ApiCategoryCreate()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const appDto = CategoryPresentationMapper.toCreateAppDto({ ...createDto, userId: user.userId });
    const category = await this.createCategoryUseCase.execute(appDto);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @ApiCategoryFindAll()
  async findAll(
    @Req() req: Request,
    @Query() filters: CategoryFilterDto,
  ): Promise<CategoryResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const appFilters = CategoryPresentationMapper.toFilterAppDto({
      ...filters,
      userId: user.role === 'admin' && filters.userId ? filters.userId : user.userId,
    });
    const categories = await this.findAllCategoriesUseCase.execute(appFilters);
    return CategoryPresentationMapper.toResponseDtoArray(categories);
  }

  @ApiCategoryFindById()
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.findCategoryByIdUseCase.execute(id);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @ApiCategoryUpdate()
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const appDto = CategoryPresentationMapper.toUpdateAppDto(updateDto);
    const category = await this.updateCategoryUseCase.execute(id, appDto, user.userId);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @ApiCategoryDelete()
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    await this.deleteCategoryUseCase.execute(id, user.userId);
  }
}
