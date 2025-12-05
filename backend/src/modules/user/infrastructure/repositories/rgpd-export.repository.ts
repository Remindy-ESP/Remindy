import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RgpdExportEntity } from '../../../../infrastructure/database/entities/rgpd-export.entity';

@Injectable()
export class RgpdExportRepository {
  constructor(
    @InjectRepository(RgpdExportEntity)
    private readonly repo: Repository<RgpdExportEntity>,
  ) {}

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
}
