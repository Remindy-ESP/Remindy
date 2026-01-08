import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IDocumentRepository } from '../document/application/ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../document/application/ports/document-repository.interface';

/**
 * Interface pour les quotas de stockage
 */
export interface StorageQuota {
  /**
   * Espace total disponible en octets
   */
  totalBytes: number;

  /**
   * Espace utilisé en octets
   */
  usedBytes: number;

  /**
   * Espace restant en octets
   */
  availableBytes: number;

  /**
   * Pourcentage d'utilisation (0-100)
   */
  usagePercentage: number;

  /**
   * Nombre total de documents
   */
  documentCount: number;

  /**
   * Espace total formaté (ex: "2.5 GB")
   */
  totalFormatted: string;

  /**
   * Espace utilisé formaté
   */
  usedFormatted: string;

  /**
   * Espace disponible formaté
   */
  availableFormatted: string;
}

/**
 * Service de gestion des quotas de stockage
 */
@Injectable()
export class StorageQuotaService {
  private readonly logger = new Logger(StorageQuotaService.name);

  // Quota par défaut : 5 GB (comme Firebase gratuit)
  private readonly DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  /**
   * Récupérer les quotas de stockage pour un utilisateur
   */
  async getQuota(userId: string): Promise<StorageQuota> {
    try {
      this.logger.log(`Calculating storage quota for user ${userId}`);

      // Récupérer tous les documents de l'utilisateur (non supprimés)
      const documents = await this.documentRepository.findByUserId(userId);

      // Calculer l'espace utilisé
      const usedBytes = documents.reduce((total, doc) => total + doc.fileSize, 0);

      // Calculer l'espace disponible
      const totalBytes = this.DEFAULT_QUOTA_BYTES;
      const availableBytes = Math.max(0, totalBytes - usedBytes);

      // Calculer le pourcentage d'utilisation
      const usagePercentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

      return {
        totalBytes,
        usedBytes,
        availableBytes,
        usagePercentage: parseFloat(usagePercentage.toFixed(2)),
        documentCount: documents.length,
        totalFormatted: this.formatBytes(totalBytes),
        usedFormatted: this.formatBytes(usedBytes),
        availableFormatted: this.formatBytes(availableBytes),
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate storage quota for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Vérifier si l'utilisateur a assez d'espace pour uploader un fichier
   */
  async canUpload(userId: string, fileSize: number): Promise<boolean> {
    try {
      const quota = await this.getQuota(userId);
      return quota.availableBytes >= fileSize;
    } catch (error) {
      this.logger.error(
        `Failed to check upload quota for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Obtenir l'espace restant pour un utilisateur
   */
  async getAvailableSpace(userId: string): Promise<number> {
    try {
      const quota = await this.getQuota(userId);
      return quota.availableBytes;
    } catch (error) {
      this.logger.error(
        `Failed to get available space for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Formater un nombre d'octets en format lisible (KB, MB, GB, etc.)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Obtenir le quota par défaut en octets
   */
  getDefaultQuota(): number {
    return this.DEFAULT_QUOTA_BYTES;
  }
}
