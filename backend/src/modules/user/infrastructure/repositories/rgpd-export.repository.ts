import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { RgpdExportEntity } from '../../../../infrastructure/database/entities/rgpd-export.entity';

@Injectable()
export class RgpdExportRepository {
  constructor(
    @InjectRepository(RgpdExportEntity)
    private readonly repo: Repository<RgpdExportEntity>,
  ) {}

  async findById(id: string): Promise<RgpdExportEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<RgpdExportEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: {
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
    format: 'json' | 'csv';
    requestedBy: 'user' | 'admin' | 'automated';
    ipAddress: string;
  }): Promise<RgpdExportEntity> {
    const exportRequest = this.repo.create(data);
    return this.repo.save(exportRequest);
  }

  async update(
    id: string,
    data: Partial<{
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
      fileR2Key: string;
      fileSize: number;
      signedUrl: string;
      expiresAt: Date;
      errorMessage: string;
      completedAt: Date;
    }>,
  ): Promise<RgpdExportEntity> {
    await this.repo.update({ id }, data);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error(`Export with id ${id} not found after update`);
    }
    return updated;
  }

  async createRequest(userId: string, format: 'json' | 'csv') {
    console.log('[RGPD] createRequest called with userId =', userId);
    const exportRequest = this.repo.create({
      userId,
      format,
      status: 'pending',
      requestedBy: 'user',
    });

    return this.repo.save(exportRequest);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByUserId(userId: string) {
    return this.repo.find({ where: { userId } });
  }

  async create(data: DeepPartial<RgpdExportEntity>) {
    const exportRequest = this.repo.create(data);
    return this.repo.save(exportRequest);
  }

  async update(id: string, data: DeepPartial<RgpdExportEntity>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
