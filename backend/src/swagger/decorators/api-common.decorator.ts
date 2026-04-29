import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

export const ApiBadRequest = (description = 'Validation error') =>
  ApiBadRequestResponse({ description });

export const ApiUnauthorized = (description = 'Unauthorized') =>
  ApiUnauthorizedResponse({ description });

export const ApiForbidden = (description = 'Forbidden — insufficient permissions') =>
  ApiForbiddenResponse({ description });

export const ApiNotFound = (resource: string) =>
  ApiNotFoundResponse({ description: `${resource} not found` });

export const ApiConflict = (description: string) => ApiConflictResponse({ description });

export const ApiServerError = () =>
  ApiInternalServerErrorResponse({ description: 'Internal server error' });

/** 401 + 400 + 500 — standard user-facing endpoint errors */
export const ApiUserErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiBadRequestResponse({ description: 'Validation error' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );

/** 401 + 403 + 500 — standard admin endpoint errors */
export const ApiAdminErrors = () =>
  applyDecorators(
    ApiUnauthorizedResponse({ description: 'Unauthorized — admin JWT required' }),
    ApiForbiddenResponse({ description: 'Forbidden — insufficient admin role' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
