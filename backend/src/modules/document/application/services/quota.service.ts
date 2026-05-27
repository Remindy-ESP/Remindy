import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import type { IDocumentRepository } from '../ports/document-repository.interface';
import {
  QUOTA_LIMITS,
  QuotaLimits,
  resolveRole,
  isUnknownRole,
  UNLIMITED_DOCUMENTS,
} from '../../../storage/quota.constants';
import { BYTES_IN_KB, BYTES_IN_MB, BYTES_IN_GB, bytesToMB } from '../../../storage/quota.formatter';

export type UserRole = string;
export type { QuotaLimits as UserQuotaLimits };

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  getMaxFileSize(userRole: UserRole): number {
    return QUOTA_LIMITS[resolveRole(userRole)].maxFileSize;
  }

  getMaxTotalStorage(userRole: UserRole): number {
    return QUOTA_LIMITS[resolveRole(userRole)].maxTotalStorage;
  }

  getMaxDocumentsCount(userRole: UserRole): number {
    return QUOTA_LIMITS[resolveRole(userRole)].maxDocumentsCount;
  }

  getQuotaLimits(userRole: UserRole): QuotaLimits {
    return { ...QUOTA_LIMITS[resolveRole(userRole)] };
  }

  async getUserStorageUsed(userId: string): Promise<number> {
    return this.documentRepository.sumFileSizeByUserId(userId);
  }

  async getUserDocumentsCount(userId: string): Promise<number> {
    return this.documentRepository.countByUserId(userId);
  }

  async checkUserQuota(userId: string, userRole: UserRole, fileSize: number): Promise<void> {
    const limits = this.resolveLimits(userId, userRole);

    this.assertFileSizeAllowed(userId, fileSize, limits);
    const documentsCount = await this.assertDocumentCountAllowed(userId, limits);
    const storageUsed = await this.assertStorageAllowed(userId, fileSize, limits);

    this.logger.debug(
      `Quota check passed for user ${userId}: ${documentsCount}/${limits.maxDocumentsCount} docs, ${bytesToMB(storageUsed)}/${bytesToMB(limits.maxTotalStorage)}MB storage`,
    );
  }

  async getUserQuotaUsage(
    userId: string,
    userRole: UserRole,
  ): Promise<{
    documentsCount: number;
    maxDocuments: number;
    storageUsed: number;
    maxStorage: number;
    storageUsedPercent: number;
    documentsUsedPercent: number;
  }> {
    const limits = QUOTA_LIMITS[resolveRole(userRole)];
    const [documentsCount, storageUsed] = await Promise.all([
      this.getUserDocumentsCount(userId),
      this.getUserStorageUsed(userId),
    ]);

    return {
      documentsCount,
      maxDocuments: limits.maxDocumentsCount,
      storageUsed,
      maxStorage: limits.maxTotalStorage,
      storageUsedPercent: percent(storageUsed, limits.maxTotalStorage),
      documentsUsedPercent: percent(documentsCount, limits.maxDocumentsCount),
    };
  }

  async canUserUpload(
    userId: string,
    userRole: UserRole,
    fileSize: number,
  ): Promise<{ canUpload: boolean; reason?: string }> {
    try {
      await this.checkUserQuota(userId, userRole, fileSize);
      return { canUpload: true };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return { canUpload: false, reason: error.message };
      }
      throw error;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < BYTES_IN_KB) return `${bytes} B`;
    if (bytes < BYTES_IN_MB) return `${(bytes / BYTES_IN_KB).toFixed(2)} KB`;
    if (bytes < BYTES_IN_GB) return `${(bytes / BYTES_IN_MB).toFixed(2)} MB`;
    return `${(bytes / BYTES_IN_GB).toFixed(2)} GB`;
  }

  private resolveLimits(userId: string, userRole: UserRole): QuotaLimits {
    const role = resolveRole(userRole);
    if (isUnknownRole(userRole, role)) {
      this.logger.warn(
        `Unknown role '${userRole ?? '(none)'}' for user ${userId}, defaulting to freemium quota`,
      );
    }
    return QUOTA_LIMITS[role];
  }

  private assertFileSizeAllowed(userId: string, fileSize: number, limits: QuotaLimits): void {
    if (fileSize <= limits.maxFileSize) return;

    const maxSizeMB = bytesToMB(limits.maxFileSize);
    const fileSizeMB = bytesToMB(fileSize);
    this.logger.warn(
      `User ${userId} tried to upload file of ${fileSizeMB}MB (limit: ${maxSizeMB}MB)`,
    );
    throw new ForbiddenException(
      `File size (${fileSizeMB}MB) exceeds your plan limit (${maxSizeMB}MB). Upgrade to premium for larger files.`,
    );
  }

  private async assertDocumentCountAllowed(userId: string, limits: QuotaLimits): Promise<number> {
    const documentsCount = await this.getUserDocumentsCount(userId);
    if (limits.maxDocumentsCount === UNLIMITED_DOCUMENTS) return documentsCount;
    if (documentsCount < limits.maxDocumentsCount) return documentsCount;

    this.logger.warn(
      `User ${userId} reached document count limit: ${documentsCount}/${limits.maxDocumentsCount}`,
    );
    throw new ForbiddenException(
      `You have reached your document limit (${limits.maxDocumentsCount} documents). Please delete some documents or upgrade to premium.`,
    );
  }

  private async assertStorageAllowed(
    userId: string,
    fileSize: number,
    limits: QuotaLimits,
  ): Promise<number> {
    const storageUsed = await this.getUserStorageUsed(userId);
    const newTotalStorage = storageUsed + fileSize;
    if (newTotalStorage <= limits.maxTotalStorage) return storageUsed;

    const maxStorageMB = bytesToMB(limits.maxTotalStorage);
    const usedStorageMB = bytesToMB(storageUsed);
    const newTotalMB = bytesToMB(newTotalStorage);
    this.logger.warn(
      `User ${userId} would exceed storage limit: ${newTotalMB}MB > ${maxStorageMB}MB`,
    );
    throw new ForbiddenException(
      `This upload would exceed your storage limit. Used: ${usedStorageMB}MB / ${maxStorageMB}MB. Please delete some documents or upgrade to premium.`,
    );
  }
}

function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100 * 100) / 100;
}
