import { applyDecorators, Get, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
} from '@nestjs/swagger';

export const ApiSupportGetCategories = () =>
  applyDecorators(
    Get('categories'),
    ApiOperation({ summary: 'List support ticket categories' }),
    ApiOkResponse({ description: 'List of categories' }),
  );

export const ApiSupportCreate = () =>
  applyDecorators(
    Post(),
    ApiOperation({ summary: 'Create a support ticket' }),
    ApiCreatedResponse({ description: 'Support ticket created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiSupportListMine = () =>
  applyDecorators(
    Get('me'),
    ApiOperation({ summary: 'List my support tickets' }),
    ApiOkResponse({ description: 'List of my support tickets' }),
  );

export const ApiSupportGetById = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get details of one of my support tickets' }),
    ApiParam({ name: 'id', description: 'Ticket ID' }),
    ApiOkResponse({ description: 'Ticket details' }),
    ApiNotFoundResponse({ description: 'Ticket not found' }),
  );

export const ApiSupportReply = () =>
  applyDecorators(
    Post(':id/reply'),
    ApiOperation({ summary: 'Reply to one of my support tickets' }),
    ApiParam({ name: 'id', description: 'Ticket ID' }),
    ApiOkResponse({ description: 'Reply added' }),
    ApiNotFoundResponse({ description: 'Ticket not found' }),
  );
