import { Injectable } from '@nestjs/common';
import { RgpdExportRepository } from '../../infrastructure/repositories/rgpd-export.repository';
import { RequestRgpdExportDto } from '../dto/request-export-rgpd.dto';

@Injectable()
export class RequestRgpdExportUseCase {
  constructor(
    private readonly rgpdExportRepo: RgpdExportRepository,
  ) {}

  async execute(userId: string, dto: RequestRgpdExportDto) {
  const format = dto.format ?? 'json';

  return this.rgpdExportRepo.createRequest(userId, format);
}
}
