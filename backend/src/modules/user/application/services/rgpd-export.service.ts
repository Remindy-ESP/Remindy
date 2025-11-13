import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RgpdExportRepository } from '../../infrastructure/repositories/rgpd-export.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import {
  CreateRgpdExportDto,
  RgpdExportResponseDto,
} from '../../presentation/dto/rgpd-export.dto';

@Injectable()
export class RgpdExportService {
  constructor(
    private readonly rgpdExportRepository: RgpdExportRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createExportRequest(
    userId: string,
    createDto: CreateRgpdExportDto,
    ipAddress: string,
  ): Promise<RgpdExportResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if there's already a pending or processing export
    const existingExports = await this.rgpdExportRepository.findByUserId(userId);
    const hasPendingExport = existingExports.some(
      (exp) => exp.status === 'pending' || exp.status === 'processing',
    );

    if (hasPendingExport) {
      throw new BadRequestException(
        'You already have a pending export request. Please wait for it to complete.',
      );
    }

    // Validate format
    const format = createDto.format || 'json';
    if (!['json', 'csv'].includes(format)) {
      throw new BadRequestException('Invalid format. Must be json or csv');
    }

    // Create export request
    const exportEntity = await this.rgpdExportRepository.create({
      userId,
      status: 'pending',
      format: format as 'json' | 'csv',
      requestedBy: 'user',
      ipAddress,
    });

    // TODO: Trigger background job to process the export
    // This would typically be done using a queue system like BullMQ
    // Example: await this.queueService.addExportJob(exportEntity.id);

    return this.mapToResponseDto(exportEntity);
  }

  async getExportStatus(
    userId: string,
    exportId: string,
  ): Promise<RgpdExportResponseDto> {
    const exportEntity = await this.rgpdExportRepository.findById(exportId);

    if (!exportEntity) {
      throw new NotFoundException('Export request not found');
    }

    // Verify that the export belongs to the user
    if (exportEntity.userId !== userId) {
      throw new NotFoundException('Export request not found');
    }

    return this.mapToResponseDto(exportEntity);
  }

  async getUserExports(userId: string): Promise<RgpdExportResponseDto[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exports = await this.rgpdExportRepository.findByUserId(userId);
    return exports.map((exp) => this.mapToResponseDto(exp));
  }

  private mapToResponseDto(exportEntity: any): RgpdExportResponseDto {
    return {
      id: exportEntity.id,
      userId: exportEntity.userId,
      status: exportEntity.status,
      format: exportEntity.format,
      fileR2Key: exportEntity.fileR2Key,
      fileSize: exportEntity.fileSize,
      signedUrl: exportEntity.signedUrl,
      expiresAt: exportEntity.expiresAt,
      errorMessage: exportEntity.errorMessage,
      requestedBy: exportEntity.requestedBy,
      createdAt: exportEntity.createdAt,
      completedAt: exportEntity.completedAt,
    };
  }

  // This method would be called by a background job processor
  async processExport(exportId: string): Promise<void> {
    const exportEntity = await this.rgpdExportRepository.findById(exportId);

    if (!exportEntity) {
      throw new NotFoundException('Export request not found');
    }

    try {
      // Update status to processing
      await this.rgpdExportRepository.update(exportId, {
        status: 'processing',
      });

      // TODO: Implement actual export logic
      // 1. Gather all user data (profile, subscriptions, documents, etc.)
      // 2. Format data according to the requested format (JSON/CSV)
      // 3. Upload to R2
      // 4. Generate signed URL
      // 5. Update export entity with file info

      // For now, this is a placeholder
      await this.rgpdExportRepository.update(exportId, {
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error) {
      // Update status to failed with error message
      await this.rgpdExportRepository.update(exportId, {
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred',
      });
    }
  }
}
