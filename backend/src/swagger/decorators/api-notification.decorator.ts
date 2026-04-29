import { applyDecorators, Get, Put, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationResponseDto } from '../../modules/notification/presentation/dto/notification-response.dto';

export const ApiNotificationFindAll = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get all notifications with optional filters' }),
    ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' }),
    ApiQuery({ name: 'channel', required: false, description: 'Filter by channel' }),
    ApiQuery({ name: 'status', required: false, description: 'Filter by status' }),
    ApiQuery({ name: 'is_read', required: false, description: 'Filter by read state' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' }),
    ApiQuery({ name: 'sort', required: false, description: 'Sort order (created_at:asc|desc)' }),
    ApiOkResponse({ type: [NotificationResponseDto], description: 'List of notifications' }),
  );

export const ApiNotificationSnooze = () =>
  applyDecorators(
    Put(':id/snooze'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Snooze a notification' }),
    ApiParam({ name: 'id', description: 'Notification ID' }),
    ApiOkResponse({ type: NotificationResponseDto, description: 'Notification snoozed' }),
    ApiNotFoundResponse({ description: 'Notification not found' }),
    ApiBadRequestResponse({ description: 'Invalid date (must be in the future)' }),
  );

export const ApiNotificationMarkRead = () =>
  applyDecorators(
    Put(':id/mark-read'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Mark a notification as read' }),
    ApiParam({ name: 'id', description: 'Notification ID' }),
    ApiOkResponse({ type: NotificationResponseDto, description: 'Notification marked as read' }),
    ApiNotFoundResponse({ description: 'Notification not found' }),
    ApiBadRequestResponse({ description: 'Notification already read' }),
  );
