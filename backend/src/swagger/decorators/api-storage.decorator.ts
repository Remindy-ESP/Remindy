import { applyDecorators, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export const ApiStorageGetQuota = () =>
  applyDecorators(
    Get('quota'),
    ApiOperation({ summary: 'Get used and available storage quota' }),
    ApiOkResponse({ description: 'Storage quota information' }),
  );
