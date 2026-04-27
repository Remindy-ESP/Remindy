import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeedService } from '../../application/services/seed.service';
import { ApiSeedAll } from '../../../../swagger/decorators/api-seed.decorator';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @ApiSeedAll()
  async seed() {
    return await this.seedService.seedAll();
  }
}
