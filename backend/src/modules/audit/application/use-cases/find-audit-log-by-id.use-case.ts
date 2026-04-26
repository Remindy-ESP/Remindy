import { Injectable, NotFoundException } from '@nestjs/common';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AuditLogResponseMapper } from '../mappers/audit-log-response.mapper';

@Injectable()
export class FindAuditLogByIdUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogRepository.findById(id);

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return AuditLogResponseMapper.toDto(auditLog);
  }
}
