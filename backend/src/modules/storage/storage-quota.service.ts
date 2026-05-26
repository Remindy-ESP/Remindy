import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IDocumentRepository } from '../document/application/ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../document/application/ports/document-repository.interface';
import { QUOTA_LIMITS, resolveRole, isUnknownRole } from './quota.constants';
import { BYTES_IN_KB } from './quota.formatter';

export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercentage: number;
  documentCount: number;
  maxDocuments: number;
  maxFileSize: number;
  totalFormatted: string;
  usedFormatted: string;
  availableFormatted: string;
  maxFileSizeFormatted: string;
}

@Injectable()
export class StorageQuotaService {
  private readonly logger = new Logger(StorageQuotaService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async getQuota(userId: string, userRole?: string): Promise<StorageQuota> {
    return this.withErrorLog(`Failed to calculate storage quota for user ${userId}`, async () => {
      this.logger.log(`Calculating storage quota for user ${userId} with role ${userRole}`);

      const [usedBytes, documentCount] = await Promise.all([
        this.documentRepository.sumFileSizeByUserId(userId),
        this.documentRepository.countByUserId(userId),
      ]);

      const limits = QUOTA_LIMITS[resolveRole(userRole)];
      const totalBytes = this.getTotalQuotaByRole(userRole);
      const availableBytes = Math.max(0, totalBytes - usedBytes);
      const usagePercentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

      return {
        totalBytes,
        usedBytes,
        availableBytes,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)),
        documentCount,
        maxDocuments: limits.maxDocumentsCount,
        maxFileSize: limits.maxFileSize,
        totalFormatted: this.formatBytes(totalBytes),
        usedFormatted: this.formatBytes(usedBytes),
        availableFormatted: this.formatBytes(availableBytes),
        maxFileSizeFormatted: this.formatBytes(limits.maxFileSize),
      };
    });
  }

  async canUpload(userId: string, fileSize: number, userRole?: string): Promise<boolean> {
    return this.withErrorLog(`Failed to check upload quota for user ${userId}`, async () => {
      const quota = await this.getQuota(userId, userRole);
      return quota.availableBytes >= fileSize;
    });
  }

  async getAvailableSpace(userId: string, userRole?: string): Promise<number> {
    return this.withErrorLog(`Failed to get available space for user ${userId}`, async () => {
      const quota = await this.getQuota(userId, userRole);
      return quota.availableBytes;
    });
  }

  getQuotaForRole(role: string): number {
    return this.getTotalQuotaByRole(role);
  }

  private getTotalQuotaByRole(userRole?: string): number {
    const role = resolveRole(userRole);
    if (isUnknownRole(userRole, role)) {
      this.logger.warn(`Unknown role '${userRole ?? '(none)'}', defaulting to freemium quota`);
    }
    return QUOTA_LIMITS[role].maxTotalStorage;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_IN_KB));

    return `${parseFloat((bytes / Math.pow(BYTES_IN_KB, i)).toFixed(2))} ${sizes[i]}`;
  }

  private async withErrorLog<T>(message: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
