import { applyDecorators, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventSeriesResponseDto } from '../../modules/event-series/presentation/dto/event-series-response.dto';

export const ApiEventSeriesCreate = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a recurrence rule for a subscription' }),
    ApiCreatedResponse({ type: EventSeriesResponseDto, description: 'Recurrence rule created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiEventSeriesFindBySubscription = () =>
  applyDecorators(
    Get('subscription/:subscriptionId'),
    ApiOperation({ summary: 'Get the recurrence rule for a subscription' }),
    ApiParam({ name: 'subscriptionId', description: 'Subscription ID' }),
    ApiOkResponse({ type: EventSeriesResponseDto, description: 'Recurrence rule found' }),
    ApiNotFoundResponse({ description: 'Recurrence rule not found' }),
  );

export const ApiEventSeriesGenerate = () =>
  applyDecorators(
    Get(':id/generate'),
    ApiOperation({ summary: 'Generate event occurrences for a period' }),
    ApiParam({ name: 'id', description: 'Event series ID' }),
    ApiQuery({
      name: 'start',
      required: false,
      description: 'Start date (ISO 8601)',
      example: '2025-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'end',
      required: false,
      description: 'End date (ISO 8601)',
      example: '2025-12-31T23:59:59Z',
    }),
    ApiQuery({
      name: 'max',
      required: false,
      type: Number,
      description: 'Max occurrences',
      example: 12,
    }),
    ApiOkResponse({ description: 'Generated occurrences' }),
  );
