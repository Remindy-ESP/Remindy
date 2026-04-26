import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import {
  IAuditLogRepository,
  AuditLogFilter,
  PaginatedResult,
  AuditStats,
  StatsPeriod,
} from '../../domain/repositories/audit-log.repository';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { Severity } from '../../domain/enums/severity.enum';

@Injectable()
export class AuditLogTypeOrmRepository extends IAuditLogRepository {
  constructor(
    @InjectRepository(AdminAuditLogEntity)
    private readonly repository: Repository<AdminAuditLogEntity>,
    private readonly mapper: AuditLogMapper,
  ) {
    super();
  }

  async create(auditLog: AuditLog): Promise<AuditLog> {
    const entity = this.mapper.toEntity(auditLog);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return this.mapper.toDomain(entity);
  }

  async findAll(filter: AuditLogFilter): Promise<PaginatedResult<AuditLog>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.createFilteredQuery(filter);

    // Apply sorting
    const sortBy = filter.sortBy ?? 'createdAt';
    const sortOrder = filter.sortOrder ?? 'DESC';
    queryBuilder.orderBy(`audit.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const entities = await queryBuilder.getMany();
    const data = entities.map(entity => this.mapper.toDomain(entity));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllForExport(filter: AuditLogFilter): Promise<AuditLog[]> {
    const queryBuilder = this.createFilteredQuery(filter);
    queryBuilder.orderBy('audit.createdAt', 'DESC');

    // Limit export to 10000 records for safety
    queryBuilder.take(10000);

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.mapper.toDomain(entity));
  }

  async getStats(period: StatsPeriod): Promise<AuditStats> {
    const { dateFrom, dateTo } = period;

    // Total logs in period
    const totalLogs = await this.repository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .getCount();

    // Logs per day
    const logsPerDayRaw = await this.repository
      .createQueryBuilder('audit')
      .select("TO_CHAR(audit.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .groupBy("TO_CHAR(audit.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const logsPerDay = logsPerDayRaw.map(row => ({
      date: row.date as string,
      count: parseInt(String(row.count), 10),
    }));

    // Top actions
    const topActionsRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .groupBy('audit.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topActions = topActionsRaw.map(row => ({
      action: row.action as string,
      count: parseInt(String(row.count), 10),
    }));

    // Failure rate
    const failedCount = await this.repository
      .createQueryBuilder('audit')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .andWhere('audit.success = :success', { success: false })
      .getCount();

    const failureRate = totalLogs > 0 ? (failedCount / totalLogs) * 100 : 0;

    // By severity
    const bySeverityRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .groupBy('audit.severity')
      .getRawMany();

    const bySeverity = bySeverityRaw.map(row => ({
      severity: row.severity as Severity,
      count: parseInt(String(row.count), 10),
    }));

    // By resource type
    const byResourceTypeRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.resourceType', 'resourceType')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :dateFrom', { dateFrom })
      .andWhere('audit.createdAt <= :dateTo', { dateTo })
      .groupBy('audit.resourceType')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const byResourceType = byResourceTypeRaw.map(row => ({
      resourceType: row.resourceType as string,
      count: parseInt(String(row.count), 10),
    }));

    return {
      totalLogs,
      logsPerDay,
      topActions,
      failureRate: Math.round(failureRate * 100) / 100,
      bySeverity,
      byResourceType,
    };
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(AdminAuditLogEntity)
      .where('createdAt < :date', { date })
      .execute();

    return result.affected ?? 0;
  }

  private createFilteredQuery(filter: AuditLogFilter): SelectQueryBuilder<AdminAuditLogEntity> {
    const queryBuilder = this.repository.createQueryBuilder('audit');

    if (filter.actorUserId) {
      queryBuilder.andWhere('audit.actorUserId = :actorUserId', {
        actorUserId: filter.actorUserId,
      });
    }

    if (filter.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filter.action });
    }

    if (filter.resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', {
        resourceType: filter.resourceType,
      });
    }

    if (filter.resourceId) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', {
        resourceId: filter.resourceId,
      });
    }

    if (filter.severity) {
      queryBuilder.andWhere('audit.severity = :severity', { severity: filter.severity });
    }

    if (filter.success !== undefined) {
      queryBuilder.andWhere('audit.success = :success', { success: filter.success });
    }

    if (filter.dateFrom) {
      queryBuilder.andWhere('audit.createdAt >= :dateFrom', { dateFrom: filter.dateFrom });
    }

    if (filter.dateTo) {
      queryBuilder.andWhere('audit.createdAt <= :dateTo', { dateTo: filter.dateTo });
    }

    // JSONB full-text search in before and after columns
    if (filter.search) {
      queryBuilder.andWhere(
        '(audit.before::text ILIKE :search OR audit.after::text ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    return queryBuilder;
  }
}
