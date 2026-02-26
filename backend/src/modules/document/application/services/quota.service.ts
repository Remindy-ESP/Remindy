import { Injectable, Inject, ForbiddenException, Logger } from '@nestjs/common';
import { DOCUMENT_REPOSITORY } from '../ports/document-repository.interface';
import type { IDocumentRepository } from '../ports/document-repository.interface';

export interface UserQuotaLimits {
  maxFileSize: number; // en bytes
  maxTotalStorage: number; // en bytes
  maxDocumentsCount: number;
}

export type UserRole = 'freemium' | 'premium' | 'admin';

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  // Limites par rôle
  private readonly QUOTA_LIMITS: Record<UserRole, UserQuotaLimits> = {
    freemium: {
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      maxTotalStorage: 100 * 1024 * 1024, // 100 MB
      maxDocumentsCount: 50,
    },
    premium: {
      maxFileSize: 50 * 1024 * 1024, // 50 MB
      maxTotalStorage: 10 * 1024 * 1024 * 1024, // 10 GB
      maxDocumentsCount: 1000,
    },
    admin: {
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      maxTotalStorage: 50 * 1024 * 1024 * 1024, // 50 GB
      maxDocumentsCount: -1, // illimité
    },
  };

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  /**
   * Récupère la taille maximale de fichier autorisée pour un rôle
   */
  getMaxFileSize(userRole: UserRole): number {
    return this.QUOTA_LIMITS[userRole].maxFileSize;
  }

  /**
   * Récupère le stockage total autorisé pour un rôle
   */
  getMaxTotalStorage(userRole: UserRole): number {
    return this.QUOTA_LIMITS[userRole].maxTotalStorage;
  }

  /**
   * Récupère le nombre maximum de documents autorisés pour un rôle
   */
  getMaxDocumentsCount(userRole: UserRole): number {
    return this.QUOTA_LIMITS[userRole].maxDocumentsCount;
  }

  /**
   * Récupère toutes les limites pour un rôle
   */
  getQuotaLimits(userRole: UserRole): UserQuotaLimits {
    return { ...this.QUOTA_LIMITS[userRole] };
  }

  /**
   * Calcule l'espace de stockage utilisé par un utilisateur
   */
  async getUserStorageUsed(userId: string): Promise<number> {
    const documents = await this.documentRepository.findByUserId(userId);
    const totalSize = documents.reduce((sum, doc) => sum + Number(doc.fileSize), 0);
    return totalSize;
  }

  /**
   * Récupère le nombre de documents d'un utilisateur
   */
  async getUserDocumentsCount(userId: string): Promise<number> {
    const documents = await this.documentRepository.findByUserId(userId);
    return documents.length;
  }

  /**
   * Vérifie si un utilisateur peut uploader un fichier
   * @throws ForbiddenException si les quotas sont dépassés
   */
  async checkUserQuota(userId: string, userRole: UserRole, fileSize: number): Promise<void> {
    // ⚠️ TEMPORARY: Default to 'freemium' if role is undefined or not recognized
    let role: UserRole = 'freemium';
    if (userRole && this.QUOTA_LIMITS[userRole]) {
      role = userRole;
    } else {
      this.logger.debug(`Unknown role '${userRole}', defaulting to 'freemium'`);
    }
    const limits = this.QUOTA_LIMITS[role];

    // 1. Vérifier la taille du fichier
    if (fileSize > limits.maxFileSize) {
      const maxSizeMB = (limits.maxFileSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      this.logger.warn(
        `User ${userId} tried to upload file of ${fileSizeMB}MB (limit: ${maxSizeMB}MB)`,
      );
      throw new ForbiddenException(
        `File size (${fileSizeMB}MB) exceeds your plan limit (${maxSizeMB}MB). Upgrade to premium for larger files.`,
      );
    }

    // 2. Vérifier le nombre de documents
    const documentsCount = await this.getUserDocumentsCount(userId);
    if (limits.maxDocumentsCount !== -1 && documentsCount >= limits.maxDocumentsCount) {
      this.logger.warn(
        `User ${userId} reached document count limit: ${documentsCount}/${limits.maxDocumentsCount}`,
      );
      throw new ForbiddenException(
        `You have reached your document limit (${limits.maxDocumentsCount} documents). Please delete some documents or upgrade to premium.`,
      );
    }

    // 3. Vérifier le stockage total
    const storageUsed = await this.getUserStorageUsed(userId);
    const newTotalStorage = storageUsed + fileSize;

    if (newTotalStorage > limits.maxTotalStorage) {
      const maxStorageMB = (limits.maxTotalStorage / (1024 * 1024)).toFixed(2);
      const usedStorageMB = (storageUsed / (1024 * 1024)).toFixed(2);
      const newTotalMB = (newTotalStorage / (1024 * 1024)).toFixed(2);

      this.logger.warn(
        `User ${userId} would exceed storage limit: ${newTotalMB}MB > ${maxStorageMB}MB`,
      );
      throw new ForbiddenException(
        `This upload would exceed your storage limit. Used: ${usedStorageMB}MB / ${maxStorageMB}MB. Please delete some documents or upgrade to premium.`,
      );
    }

    // Log quota check success
    this.logger.debug(
      `Quota check passed for user ${userId}: ${documentsCount}/${limits.maxDocumentsCount} docs, ${(storageUsed / (1024 * 1024)).toFixed(2)}/${(limits.maxTotalStorage / (1024 * 1024)).toFixed(2)}MB storage`,
    );
  }

  /**
   * Récupère les statistiques d'utilisation d'un utilisateur
   */
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
    const limits = this.QUOTA_LIMITS[userRole];
    const documentsCount = await this.getUserDocumentsCount(userId);
    const storageUsed = await this.getUserStorageUsed(userId);

    const storageUsedPercent =
      limits.maxTotalStorage > 0 ? (storageUsed / limits.maxTotalStorage) * 100 : 0;

    const documentsUsedPercent =
      limits.maxDocumentsCount > 0 ? (documentsCount / limits.maxDocumentsCount) * 100 : 0;

    return {
      documentsCount,
      maxDocuments: limits.maxDocumentsCount,
      storageUsed,
      maxStorage: limits.maxTotalStorage,
      storageUsedPercent: Math.round(storageUsedPercent * 100) / 100,
      documentsUsedPercent: Math.round(documentsUsedPercent * 100) / 100,
    };
  }

  /**
   * Vérifie si un utilisateur peut encore uploader (sans bloquer)
   */
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

  /**
   * Formatte une taille en bytes en format lisible
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
