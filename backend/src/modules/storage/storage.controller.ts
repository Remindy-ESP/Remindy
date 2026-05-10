import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StorageQuotaService, StorageQuota } from './storage-quota.service';
import { ApiStorageGetQuota } from '../../swagger/decorators/api-storage.decorator';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class StorageController {
  constructor(private readonly storageQuotaService: StorageQuotaService) {}

  @ApiStorageGetQuota()
  async getQuota(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ): Promise<StorageQuota> {
    return await this.storageQuotaService.getQuota(userId, userRole);
  }
}
