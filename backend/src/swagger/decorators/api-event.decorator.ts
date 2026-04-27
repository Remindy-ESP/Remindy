import { applyDecorators, Get, Put, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventResponseDto } from '../../modules/event/presentation/dto/event-response.dto';

export const ApiEventFindAll = () =>
  applyDecorators(
    Get('events'),
    ApiOperation({ summary: 'Get calendar events with optional filters' }),
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
      name: 'subscription_id',
      required: false,
      description: 'Filter by subscription ID',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['scheduled', 'completed', 'canceled', 'failed'],
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'payment_status',
      required: false,
      enum: ['pending', 'paid', 'failed'],
      description: 'Filter by payment status',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Max results (1–1000)',
      example: 100,
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      enum: ['starts_at:asc', 'starts_at:desc', 'amount:asc', 'amount:desc'],
      example: 'starts_at:asc',
    }),
    ApiOkResponse({ type: [EventResponseDto], description: 'List of events' }),
  );

export const ApiEventFindOne = () =>
  applyDecorators(
    Get('event/:id'),
    ApiOperation({ summary: 'Get an event by ID' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiOkResponse({ type: EventResponseDto, description: 'Event found' }),
    ApiNotFoundResponse({ description: 'Event not found' }),
  );

export const ApiEventReschedule = () =>
  applyDecorators(
    Put('event/:id/reschedule'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Reschedule an event' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiOkResponse({ type: EventResponseDto, description: 'Event rescheduled' }),
    ApiNotFoundResponse({ description: 'Event not found' }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
  );

export const ApiEventUpdateStatus = () =>
  applyDecorators(
    Patch('event/:id/status'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update the status of an event' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiOkResponse({ type: EventResponseDto, description: 'Status updated' }),
    ApiNotFoundResponse({ description: 'Event not found' }),
    ApiBadRequestResponse({ description: 'Invalid status transition' }),
  );

export const ApiEventUpdatePaymentStatus = () =>
  applyDecorators(
    Patch('event/:id/payment-status'),
    HttpCode(HttpStatus.OK),
    ApiOperation({ summary: 'Update the payment status of an event' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiOkResponse({ type: EventResponseDto, description: 'Payment status updated' }),
    ApiNotFoundResponse({ description: 'Event not found' }),
  );

export const ApiEventDelete = () =>
  applyDecorators(
    Delete('event/:id'),
    HttpCode(HttpStatus.NO_CONTENT),
    ApiOperation({ summary: 'Delete an event (soft delete)' }),
    ApiParam({ name: 'id', description: 'Event ID' }),
    ApiNoContentResponse({ description: 'Event deleted' }),
    ApiNotFoundResponse({ description: 'Event not found' }),
  );
