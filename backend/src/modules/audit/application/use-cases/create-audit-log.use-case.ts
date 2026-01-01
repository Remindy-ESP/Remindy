import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AuditLogResponseMapper } from '../mappers/audit-log-response.mapper';

@Injectable()
export class CreateAuditLogUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = AuditLog.create({
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      before: dto.before,
      after: dto.after,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      severity: dto.severity,
      success: dto.success,
      errorMessage: dto.errorMessage,
    });

    const savedLog = await this.auditLogRepository.create(auditLog);

    return AuditLogResponseMapper.toDto(savedLog);
  }
}
