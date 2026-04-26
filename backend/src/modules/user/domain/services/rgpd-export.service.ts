import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RgpdExportRepository } from '../../infrastructure/repositories/rgpd-export.repository';
import { UserTypeOrmRepository } from '../../infrastructure/repositories/user-typeorm.repository';

@Injectable()
export class RgpdExportService {
  constructor(
    private readonly rgpdExportRepository: RgpdExportRepository,
    private readonly userRepository: UserTypeOrmRepository,
  ) {}

  async createExportRequest(
    userId: string,
    createDto: { format?: 'json' | 'csv' },
    ipAddress: string,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const format = createDto.format ?? 'json';

    if (format !== 'json' && format !== 'csv') {
      throw new BadRequestException('Invalid format. Must be json or csv');
    }

    const existingExports = await this.rgpdExportRepository.findByUserId(userId);
    const pendingOrProcessing = existingExports.find(
      (exp: any) => exp.status === 'pending' || exp.status === 'processing',
    );

    if (pendingOrProcessing) {
      throw new BadRequestException('You already have a pending export request');
    }

    const exportRequest = await this.rgpdExportRepository.create({
      userId,
      status: 'pending',
      format,
      requestedBy: 'user',
      ipAddress,
    });

    return {
      id: exportRequest.id,
      userId: exportRequest.userId,
      status: exportRequest.status,
      format: exportRequest.format,
      fileR2Key: exportRequest.fileR2Key,
      fileSize: exportRequest.fileSize,
      signedUrl: exportRequest.signedUrl,
      expiresAt: exportRequest.expiresAt,
      errorMessage: exportRequest.errorMessage,
      requestedBy: exportRequest.requestedBy,
      createdAt: exportRequest.createdAt,
      completedAt: exportRequest.completedAt,
    };
  }

  async getExportStatus(userId: string, exportId: string) {
    const exportRequest = await this.rgpdExportRepository.findById(exportId);

    if (!exportRequest || exportRequest.userId !== userId) {
      throw new NotFoundException('Export request not found');
    }

    return {
      id: exportRequest.id,
      userId: exportRequest.userId,
      status: exportRequest.status,
      format: exportRequest.format,
      fileR2Key: exportRequest.fileR2Key,
      fileSize: exportRequest.fileSize,
      signedUrl: exportRequest.signedUrl,
      expiresAt: exportRequest.expiresAt,
      errorMessage: exportRequest.errorMessage,
      requestedBy: exportRequest.requestedBy,
      createdAt: exportRequest.createdAt,
      completedAt: exportRequest.completedAt,
    };
  }

  async getUserExports(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exports = await this.rgpdExportRepository.findByUserId(userId);

    return exports.map((exp: any) => ({
      id: exp.id,
      userId: exp.userId,
      status: exp.status,
      format: exp.format,
      fileR2Key: exp.fileR2Key,
      fileSize: exp.fileSize,
      signedUrl: exp.signedUrl,
      expiresAt: exp.expiresAt,
      errorMessage: exp.errorMessage,
      requestedBy: exp.requestedBy,
      createdAt: exp.createdAt,
      completedAt: exp.completedAt,
    }));
  }

  async processExport(exportId: string) {
    const exportRequest = await this.rgpdExportRepository.findById(exportId);

    if (!exportRequest) {
      throw new NotFoundException('Export request not found');
    }

    try {
      await this.rgpdExportRepository.update(exportId, {
        status: 'processing',
      });

      await this.rgpdExportRepository.update(exportId, {
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error: any) {
      await this.rgpdExportRepository.update(exportId, {
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }
}
