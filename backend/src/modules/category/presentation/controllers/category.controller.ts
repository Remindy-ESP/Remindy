import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryFilterDto } from '../dto/category-filter.dto';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { FindCategoryByIdUseCase } from '../../application/use-cases/find-category-by-id.use-case';
import { FindAllCategoriesUseCase } from '../../application/use-cases/find-all-categories.use-case';
import { CategoryPresentationMapper } from '../mappers/category-presentation.mapper';
import { Public } from '../../../auth/presentation/decorators/public.decorator';

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new custom category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(
    @Req() req: Request,
    @Body() createDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Extract userId from JWT token
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    // Inject userId into DTO (override any userId sent by client for security)
    const dtoWithUserId = { ...createDto, userId };

    const appDto = CategoryPresentationMapper.toCreateAppDto(dtoWithUserId);
    const category = await this.createCategoryUseCase.execute(appDto);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories (system + user custom)' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID (returns system categories + user categories)',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by category name (partial match)',
  })
  @ApiQuery({
    name: 'isSystem',
    required: false,
    description: 'Filter by system category flag',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [CategoryResponseDto],
  })
  async findAll(@Query() filters: CategoryFilterDto): Promise<CategoryResponseDto[]> {
    const appFilters = CategoryPresentationMapper.toFilterAppDto(filters);
    const categories = await this.findAllCategoriesUseCase.execute(appFilters);
    return CategoryPresentationMapper.toResponseDtoArray(categories);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.findCategoryByIdUseCase.execute(id);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category (only user own categories)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify system categories or other users categories',
  })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Extract userId from JWT token
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appDto = CategoryPresentationMapper.toUpdateAppDto(updateDto);
    const category = await this.updateCategoryUseCase.execute(id, appDto, userId);
    return CategoryPresentationMapper.toResponseDto(category);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (only user own categories, not system)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete system categories or other users categories',
  })
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    // Extract userId from JWT token
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    await this.deleteCategoryUseCase.execute(id, userId);
  }
}
