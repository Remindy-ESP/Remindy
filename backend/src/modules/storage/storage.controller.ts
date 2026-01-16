import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StorageQuotaService, StorageQuota } from './storage-quota.service';

/**
 * Storage Controller
 * Gère les endpoints liés au stockage (quotas, espace disponible)
 */
@ApiTags('Storage')
@Controller('storage')
@UseGuards(ThrottlerGuard)
export class StorageController {
  constructor(private readonly storageQuotaService: StorageQuotaService) {}

  @Get('quota')
  @ApiOperation({ summary: "Obtenir l'espace de stockage utilisé et disponible" })
  @ApiResponse({
    status: 200,
    description: 'Informations sur le quota de stockage',
    schema: {
      type: 'object',
      properties: {
        totalBytes: {
          type: 'number',
          example: 5368709120,
          description: 'Espace total en octets (5 GB)',
        },
        usedBytes: {
          type: 'number',
          example: 1234567890,
          description: 'Espace utilisé en octets',
        },
        availableBytes: {
          type: 'number',
          example: 4134141230,
          description: 'Espace restant en octets',
        },
        usagePercentage: {
          type: 'number',
          example: 23.0,
          description: "Pourcentage d'utilisation (0-100)",
        },
        documentCount: {
          type: 'number',
          example: 42,
          description: 'Nombre total de documents',
        },
        totalFormatted: {
          type: 'string',
          example: '5 GB',
          description: 'Espace total formaté',
        },
        usedFormatted: {
          type: 'string',
          example: '1.15 GB',
          description: 'Espace utilisé formaté',
        },
        availableFormatted: {
          type: 'string',
          example: '3.85 GB',
          description: 'Espace disponible formaté',
        },
      },
    },
  })
  async getQuota(): Promise<StorageQuota> {
    // TODO: Get userId from authenticated user
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    return await this.storageQuotaService.getQuota(userId);
  }
}
