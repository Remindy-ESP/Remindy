import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService } from '../../application/services/seed.service';
import { Public } from 'src/modules/auth/presentation/decorators/public.decorator';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed database with initial data',
    description:
      'Creates roles, contracts, users, and user preferences if they do not exist. Safe to run multiple times.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database seeded successfully',
    schema: {
      example: {
        message: 'Database seeding completed successfully',
        details: {
          roles: ['user_freemium', 'user_premium', 'user_admin'],
          contracts: ['netflix', 'spotify', 'amazon_prime', 'disney_plus', 'apple_music'],
          users: [
            'sophie.martin@example.com',
            'pierre.dubois@example.com',
            'marie.lambert@example.com',
          ],
        },
      },
    },
  })
  async seed() {
    return await this.seedService.seedAll();
  }
}
