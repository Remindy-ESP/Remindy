import { applyDecorators, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../modules/auth/presentation/decorators/public.decorator';

export const ApiSeedAll = () =>
  applyDecorators(
    Post(),
    Public(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Seed database with initial data',
      description:
        'Creates roles, contracts, users, and preferences if they do not exist. Safe to run multiple times.',
    }),
    ApiOkResponse({ description: 'Database seeded successfully' }),
  );
