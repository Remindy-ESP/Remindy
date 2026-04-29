import { applyDecorators, Get, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FolderResponseDto } from '../../modules/folder/presentation/dto/folder.dto';

export const ApiFolderCreate = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new folder' }),
    ApiCreatedResponse({ type: FolderResponseDto, description: 'Folder created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiConflictResponse({ description: 'A folder with this name already exists' }),
  );

export const ApiFolderFindAll = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get all folders for the current user' }),
    ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent folder' }),
    ApiQuery({
      name: 'isDefault',
      required: false,
      type: Boolean,
      description: 'Default folders only',
    }),
    ApiQuery({
      name: 'includeDeleted',
      required: false,
      type: Boolean,
      description: 'Include soft-deleted folders',
      example: false,
    }),
    ApiOkResponse({ type: [FolderResponseDto], description: 'List of folders' }),
  );

export const ApiFolderUpdate = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({ summary: 'Update a folder (rename, change color, move)' }),
    ApiParam({ name: 'id', description: 'Folder ID' }),
    ApiOkResponse({ type: FolderResponseDto, description: 'Folder updated' }),
    ApiNotFoundResponse({ description: 'Folder not found' }),
    ApiForbiddenResponse({ description: 'Permission denied' }),
  );

export const ApiFolderDelete = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a folder (soft delete)' }),
    ApiParam({ name: 'id', description: 'Folder ID' }),
    ApiNoContentResponse({ description: 'Folder deleted' }),
    ApiNotFoundResponse({ description: 'Folder not found' }),
    ApiForbiddenResponse({ description: 'Permission denied' }),
    ApiBadRequestResponse({ description: 'Folder contains documents or sub-folders' }),
  );

export const ApiFolderMoveDocument = () =>
  applyDecorators(
    Post(':id/documents/:docId'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Move a document into a folder' }),
    ApiParam({ name: 'id', description: 'Destination folder ID' }),
    ApiParam({ name: 'docId', description: 'Document ID to move' }),
    ApiOkResponse({ description: 'Document moved successfully' }),
    ApiNotFoundResponse({ description: 'Folder or document not found' }),
    ApiForbiddenResponse({ description: 'Permission denied' }),
  );
