import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RgpdExportEntity } from '../../../../infrastructure/database/entities/rgpd-export.entity';

@Injectable()
export class RgpdExportRepository {
  constructor(
    @InjectRepository(RgpdExportEntity)
    private readonly rgpdExportRepository: Repository<RgpdExportEntity>,
  ) {}

  async findById(id: string): Promise<RgpdExportEntity | null> {
    return this.rgpdExportRepository.findOne({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<RgpdExportEntity[]> {
    return this.rgpdExportRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingExports(): Promise<RgpdExportEntity[]> {
    return this.rgpdExportRepository.find({
      where: [{ status: 'pending' }, { status: 'processing' }],
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<RgpdExportEntity>): Promise<RgpdExportEntity> {
    const exportEntity = this.rgpdExportRepository.create(data);
    return this.rgpdExportRepository.save(exportEntity);
  }

  async update(id: string, data: Partial<RgpdExportEntity>): Promise<RgpdExportEntity | null> {
    await this.rgpdExportRepository.update(id, data);
    return this.findById(id);
  }

  async save(exportEntity: RgpdExportEntity): Promise<RgpdExportEntity> {
    return this.rgpdExportRepository.save(exportEntity);
  }
}
