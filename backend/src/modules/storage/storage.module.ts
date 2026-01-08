import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageQuotaService } from './storage-quota.service';
import { DocumentModule } from '../document/document.module';

/**
 * Storage Module
 * Gère les fonctionnalités de stockage (quotas, espace disponible)
 */
@Module({
  imports: [DocumentModule],
  controllers: [StorageController],
  providers: [StorageQuotaService],
  exports: [StorageQuotaService],
})
export class StorageModule {}
