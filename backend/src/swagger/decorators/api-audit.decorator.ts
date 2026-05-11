import { applyDecorators, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MfaRequiredGuard } from '../../modules/audit/presentation/guards/mfa-required.guard';
import {
  AuditLogResponseDto,
  PaginatedAuditLogsResponseDto,
} from '../../modules/audit/presentation/dto/audit-log.response.dto';
import { AuditStatsResponseDto } from '../../modules/audit/presentation/dto/audit-stats.response.dto';

const AdminAuditErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Unauthorized — JWT required' }),
    ApiForbiddenResponse({ description: 'Forbidden — admin role and MFA required' }),
  );

export const ApiAuditCreate = () =>
  applyDecorators(
    Post('create'),
    ApiOperation({ summary: 'Create a manual audit log entry' }),
    ApiCreatedResponse({ type: AuditLogResponseDto, description: 'Audit log created' }),
    ApiBadRequestResponse({ description: 'Invalid input data' }),
    AdminAuditErrors(),
  );

export const ApiAuditFindAll = () =>
  applyDecorators(
    Get('logs'),
    UseGuards(MfaRequiredGuard),
    ApiOperation({ summary: 'Get paginated audit logs with filters' }),
    ApiOkResponse({ type: PaginatedAuditLogsResponseDto, description: 'List of audit logs' }),
    AdminAuditErrors(),
  );

export const ApiAuditGetStats = () =>
  applyDecorators(
    Get('stats'),
    UseGuards(MfaRequiredGuard),
    ApiOperation({ summary: 'Get audit statistics for a period' }),
    ApiOkResponse({ type: AuditStatsResponseDto, description: 'Audit statistics' }),
    AdminAuditErrors(),
  );

export const ApiAuditExport = () =>
  applyDecorators(
    Get('export'),
    UseGuards(MfaRequiredGuard),
    ApiOperation({ summary: 'Export audit logs as CSV or JSON' }),
    ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false }),
    ApiOkResponse({ description: 'Exported audit logs file' }),
    AdminAuditErrors(),
  );

export const ApiAuditFindOne = () =>
  applyDecorators(
    Get('logs/:id'),
    UseGuards(MfaRequiredGuard),
    ApiOperation({ summary: 'Get audit log details by ID' }),
    ApiParam({
      name: 'id',
      description: 'Audit log UUID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiOkResponse({ type: AuditLogResponseDto, description: 'Audit log details' }),
    ApiNotFoundResponse({ description: 'Audit log not found' }),
    AdminAuditErrors(),
  );
