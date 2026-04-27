import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class CloudflareR2Service {
  private readonly logger = new Logger(CloudflareR2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'remindy-documents');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 credentials are not configured in .env');
    }

    // Configuration du client S3 pour Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('Cloudflare R2 service initialized');
  }

  /**
   * Upload un fichier vers Cloudflare R2
   * @param fileBuffer Buffer du fichier
   * @param key Chemin du fichier dans le bucket (ex: users/123/documents/file.pdf)
   * @param mimeType Type MIME du fichier
   * @returns URL publique du fichier
   */
  async uploadFile(fileBuffer: Buffer, key: string, mimeType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ContentLength: fileBuffer.length,
      });

      await this.s3Client.send(command);

      // Générer l'URL publique (ou URL signée si le bucket est privé)
      const fileUrl = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : await this.getSignedUrl(key, 604800); // URL valide 7 jours (max autorisé par S3/R2)

      this.logger.log(`File uploaded successfully: ${key}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file to R2: ${error.message}`);
    }
  }

  /**
   * Télécharge un fichier depuis Cloudflare R2
   * @param key Chemin du fichier dans le bucket
   * @returns Buffer du fichier
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convertir le stream en buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      this.logger.log(`File downloaded successfully: ${key}`);
      return buffer;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to download file ${key}: ${err.message}`, err.stack);
      throw new Error(`Failed to download file from R2: ${err.message}`);
    }
  }

  /**
   * Supprime un fichier de Cloudflare R2
   * @param key Chemin du fichier dans le bucket
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file from R2: ${error.message}`);
    }
  }

  /**
   * Génère une URL signée pour accéder temporairement à un fichier
   * @param key Chemin du fichier dans le bucket
   * @param expiresIn Durée de validité en secondes (défaut: 1 heure)
   * @returns URL signée
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}: ${error.message}`, error.stack);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Vérifie si un fichier existe dans R2
   * @param key Chemin du fichier dans le bucket
   * @returns true si le fichier existe, false sinon
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Récupère les métadonnées d'un fichier sans le télécharger
   * @param key Chemin du fichier dans le bucket
   * @returns Métadonnées du fichier (taille, type, etc.)
   */
  async getFileMetadata(
    key: string,
  ): Promise<{ size: number; contentType: string; lastModified: Date }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}: ${error.message}`, error.stack);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}
