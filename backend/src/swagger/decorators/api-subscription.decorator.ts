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
import { SubscriptionResponseDto } from '../../modules/subscription/presentation/dto/subscription-response.dto';

export const ApiSubscriptionCreate = () =>
  applyDecorators(
    Post(),
    HttpCode(HttpStatus.CREATED),
    ApiOperation({ summary: 'Create a new subscription' }),
    ApiCreatedResponse({ type: SubscriptionResponseDto, description: 'Subscription created' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiSubscriptionFindAll = () =>
  applyDecorators(
    Get(),
    ApiOperation({ summary: 'Get all subscriptions with optional filters' }),
    ApiQuery({ name: 'contractId', required: false, description: 'Filter by contract ID' }),
    ApiQuery({ name: 'name', required: false, description: 'Filter by name (partial match)' }),
    ApiQuery({ name: 'currency', required: false, description: 'Filter by currency' }),
    ApiQuery({
      name: 'frequency',
      required: false,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    }),
    ApiQuery({ name: 'status', required: false, enum: ['active', 'paused', 'cancelled', 'trial'] }),
    ApiOkResponse({ type: [SubscriptionResponseDto], description: 'List of subscriptions' }),
  );

export const ApiSubscriptionFindByFrequency = () =>
  applyDecorators(
    Get('frequency/:type'),
    ApiOperation({ summary: 'Get subscriptions by billing frequency' }),
    ApiParam({
      name: 'type',
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      description: 'Billing frequency',
    }),
    ApiOkResponse({
      type: [SubscriptionResponseDto],
      description: 'Subscriptions for this frequency',
    }),
    ApiBadRequestResponse({ description: 'Invalid frequency' }),
  );

export const ApiSubscriptionFindById = () =>
  applyDecorators(
    Get(':id'),
    ApiOperation({ summary: 'Get a subscription by ID' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiOkResponse({ type: SubscriptionResponseDto, description: 'Subscription found' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
  );

export const ApiSubscriptionUpdate = () =>
  applyDecorators(
    Put(':id'),
    ApiOperation({ summary: 'Update a subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiOkResponse({ type: SubscriptionResponseDto, description: 'Subscription updated' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiSubscriptionDelete = () =>
  applyDecorators(
    Delete(':id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete a subscription (soft delete)' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiNoContentResponse({ description: 'Subscription deleted' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
  );

export const ApiSubscriptionPause = () =>
  applyDecorators(
    Post(':id/pause'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Pause a subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiOkResponse({ type: SubscriptionResponseDto, description: 'Subscription paused' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
  );

export const ApiSubscriptionResume = () =>
  applyDecorators(
    Post(':id/resume'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Resume a paused subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiOkResponse({ type: SubscriptionResponseDto, description: 'Subscription resumed' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
  );

export const ApiSubscriptionGetEvents = () =>
  applyDecorators(
    Get(':id/events'),
    ApiOperation({ summary: 'Get all events for a subscription' }),
    ApiParam({ name: 'id', description: 'Subscription ID' }),
    ApiOkResponse({ description: 'List of subscription events' }),
    ApiNotFoundResponse({ description: 'Subscription not found' }),
  );
