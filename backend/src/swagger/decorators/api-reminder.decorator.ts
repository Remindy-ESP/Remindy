import { applyDecorators, Get, Post, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReminderResponseDto } from '../../modules/reminder/presentation/dto/reminder-response.dto';

export const ApiReminderFindAll = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get all reminders with optional filters' }),
    ApiQuery({
      name: 'subscription_id',
      required: false,
      description: 'Filter by subscription ID',
    }),
    ApiQuery({ name: 'type', required: false, description: 'Filter by reminder type' }),
    ApiQuery({ name: 'enabled', required: false, description: 'Filter by enabled/disabled' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' }),
    ApiQuery({ name: 'sort', required: false, description: 'Sort order (created_at:asc|desc)' }),
    ApiOkResponse({ type: [ReminderResponseDto], description: 'List of reminders' }),
  );

export const ApiReminderFindOne = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get a reminder by ID' }),
    ApiParam({ name: 'id', description: 'Reminder ID' }),
    ApiOkResponse({ type: ReminderResponseDto, description: 'Reminder found' }),
    ApiNotFoundResponse({ description: 'Reminder not found' }),
  );

export const ApiReminderCreate = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new reminder' }),
    ApiCreatedResponse({ type: ReminderResponseDto, description: 'Reminder created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiReminderUpdate = () =>
  applyDecorators(
    Put(':id'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update a reminder' }),
    ApiParam({ name: 'id', description: 'Reminder ID' }),
    ApiOkResponse({ type: ReminderResponseDto, description: 'Reminder updated' }),
    ApiNotFoundResponse({ description: 'Reminder not found' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiReminderDelete = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a reminder (soft delete)' }),
    ApiParam({ name: 'id', description: 'Reminder ID' }),
    ApiNoContentResponse({ description: 'Reminder deleted' }),
    ApiNotFoundResponse({ description: 'Reminder not found' }),
  );
