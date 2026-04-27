import { applyDecorators, Get, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../modules/auth/presentation/decorators/public.decorator';
import { CategoryResponseDto } from '../../modules/category/presentation/dto/category-response.dto';

export const ApiCategoryCreate = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new custom category' }),
    ApiCreatedResponse({ type: CategoryResponseDto, description: 'Category created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiCategoryFindAll = () =>
  applyDecorators(
    Get(),
    Public(),
    ApiOperation({ summary: 'Get all categories (system + user custom)' }),
    ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' }),
    ApiQuery({ name: 'name', required: false, description: 'Filter by name (partial match)' }),
    ApiQuery({
      name: 'isSystem',
      required: false,
      type: Boolean,
      description: 'System categories only',
    }),
    ApiOkResponse({ type: [CategoryResponseDto], description: 'List of categories' }),
  );

export const ApiCategoryFindById = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get a single category by ID' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiOkResponse({ type: CategoryResponseDto, description: 'Category found' }),
    ApiNotFoundResponse({ description: 'Category not found' }),
  );

export const ApiCategoryUpdate = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({ summary: 'Update a category (own categories only)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiOkResponse({ type: CategoryResponseDto, description: 'Category updated' }),
    ApiNotFoundResponse({ description: 'Category not found' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiForbiddenResponse({ description: 'Cannot modify system or other users categories' }),
  );

export const ApiCategoryDelete = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a category (own categories only, not system)' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiNoContentResponse({ description: 'Category deleted' }),
    ApiNotFoundResponse({ description: 'Category not found' }),
    ApiForbiddenResponse({ description: 'Cannot delete system or other users categories' }),
  );
