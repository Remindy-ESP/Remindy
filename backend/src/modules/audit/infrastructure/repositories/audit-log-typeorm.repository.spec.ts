import { Repository } from 'typeorm';
import { AuditLogTypeOrmRepository } from './audit-log-typeorm.repository';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { Severity } from '../../domain/enums/severity.enum';
import { createMockAuditLog, createMockAuditLogResponse } from '../../test/audit-log.factory';

type MockQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getCount: jest.Mock;
  getMany: jest.Mock;
  getRawMany: jest.Mock;
  delete: jest.Mock;
  from: jest.Mock;
  execute: jest.Mock;
};

function createQueryBuilderMock(): MockQueryBuilder {
  const qb = {
    where: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getCount: jest.fn(),
    getMany: jest.fn(),
    getRawMany: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
    execute: jest.fn(),
  };

  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.limit.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  qb.delete.mockReturnValue(qb);
  qb.from.mockReturnValue(qb);

  return qb;
}

function createEntity(overrides: Partial<AdminAuditLogEntity> = {}): AdminAuditLogEntity {
  const entity = new AdminAuditLogEntity();
  Object.assign(entity, createMockAuditLogResponse(), overrides);
  return entity;
}

describe('AuditLogTypeOrmRepository', () => {
  let sut: AuditLogTypeOrmRepository;
  let repository: jest.Mocked<Partial<Repository<AdminAuditLogEntity>>>;
  let mapper: jest.Mocked<AuditLogMapper>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mapper = {
      toEntity: jest.fn(),
      toDomain: jest.fn(),
    };

    sut = new AuditLogTypeOrmRepository(repository as Repository<AdminAuditLogEntity>, mapper);
  });

  it('creates an audit log via mapper + repository.save', async () => {
    const domain = createMockAuditLog({ id: 'audit-create-1' });
    const entityToSave = createEntity({ id: 'audit-create-1' });
    const savedEntity = createEntity({ id: 'audit-create-1', action: 'saved.action' });
    const mappedDomain = createMockAuditLog({ id: 'audit-create-1', action: 'saved.action' });

    mapper.toEntity.mockReturnValue(entityToSave);
    (repository.save as jest.Mock).mockResolvedValue(savedEntity);
    mapper.toDomain.mockReturnValue(mappedDomain);

    const result = await sut.create(domain);

    expect(mapper.toEntity).toHaveBeenCalledWith(domain);
    expect(repository.save).toHaveBeenCalledWith(entityToSave);
    expect(mapper.toDomain).toHaveBeenCalledWith(savedEntity);
    expect(result).toBe(mappedDomain);
  });

  it('findById returns null when entity does not exist', async () => {
    (repository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(sut.findById('missing-id')).resolves.toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    expect(mapper.toDomain).not.toHaveBeenCalled();
  });

  it('findById maps entity to domain when found', async () => {
    const entity = createEntity({ id: 'audit-found' });
    const domain = createMockAuditLog({ id: 'audit-found' });
    (repository.findOne as jest.Mock).mockResolvedValue(entity);
    mapper.toDomain.mockReturnValue(domain);

    const result = await sut.findById('audit-found');

    expect(result).toBe(domain);
    expect(mapper.toDomain).toHaveBeenCalledWith(entity);
  });

  it('findAll applies filters, sorting, pagination and maps results', async () => {
    const qb = createQueryBuilderMock();
    const entity1 = createEntity({ id: 'audit-1', action: 'user.update' });
    const entity2 = createEntity({ id: 'audit-2', action: 'user.delete' });
    const domain1 = createMockAuditLog({ id: 'audit-1', action: 'user.update' });
    const domain2 = createMockAuditLog({ id: 'audit-2', action: 'user.delete' });

    (repository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    qb.getCount.mockResolvedValue(3);
    qb.getMany.mockResolvedValue([entity1, entity2]);
    mapper.toDomain.mockReturnValueOnce(domain1).mockReturnValueOnce(domain2);

    const dateFrom = new Date('2026-01-01T00:00:00.000Z');
    const dateTo = new Date('2026-01-31T23:59:59.999Z');

    const result = await sut.findAll({
      actorUserId: 'user-123',
      action: 'user.update',
      resourceType: 'user',
      resourceId: 'resource-1',
      severity: Severity.WARNING,
      success: false,
      dateFrom,
      dateTo,
      search: 'needle',
      page: 2,
      limit: 2,
      sortBy: 'action',
      sortOrder: 'ASC',
    });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('audit');
    expect(qb.andWhere).toHaveBeenCalledWith('audit.actorUserId = :actorUserId', {
      actorUserId: 'user-123',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.action = :action', { action: 'user.update' });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.resourceType = :resourceType', {
      resourceType: 'user',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.resourceId = :resourceId', {
      resourceId: 'resource-1',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.severity = :severity', {
      severity: Severity.WARNING,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.success = :success', { success: false });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.createdAt >= :dateFrom', { dateFrom });
    expect(qb.andWhere).toHaveBeenCalledWith('audit.createdAt <= :dateTo', { dateTo });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(audit.before::text ILIKE :search OR audit.after::text ILIKE :search)',
      { search: '%needle%' },
    );
    expect(qb.orderBy).toHaveBeenCalledWith('audit.action', 'ASC');
    expect(qb.skip).toHaveBeenCalledWith(2);
    expect(qb.take).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      data: [domain1, domain2],
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('findAllForExport applies default ordering and export limit', async () => {
    const qb = createQueryBuilderMock();
    const entity = createEntity({ id: 'audit-export-1' });
    const domain = createMockAuditLog({ id: 'audit-export-1' });

    (repository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    qb.getMany.mockResolvedValue([entity]);
    mapper.toDomain.mockReturnValue(domain);

    const result = await sut.findAllForExport({ action: 'user.update' });

    expect(qb.andWhere).toHaveBeenCalledWith('audit.action = :action', { action: 'user.update' });
    expect(qb.orderBy).toHaveBeenCalledWith('audit.createdAt', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(10000);
    expect(result).toEqual([domain]);
  });

  it('getStats aggregates counts and rounds failure rate', async () => {
    const totalQb = createQueryBuilderMock();
    const perDayQb = createQueryBuilderMock();
    const topActionsQb = createQueryBuilderMock();
    const failedCountQb = createQueryBuilderMock();
    const bySeverityQb = createQueryBuilderMock();
    const byResourceTypeQb = createQueryBuilderMock();

    (repository.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(totalQb)
      .mockReturnValueOnce(perDayQb)
      .mockReturnValueOnce(topActionsQb)
      .mockReturnValueOnce(failedCountQb)
      .mockReturnValueOnce(bySeverityQb)
      .mockReturnValueOnce(byResourceTypeQb);

    totalQb.getCount.mockResolvedValue(3);
    perDayQb.getRawMany.mockResolvedValue([{ date: '2026-02-22', count: '2' }]);
    topActionsQb.getRawMany.mockResolvedValue([{ action: 'user.update', count: '3' }]);
    failedCountQb.getCount.mockResolvedValue(1);
    bySeverityQb.getRawMany.mockResolvedValue([{ severity: Severity.WARNING, count: '2' }]);
    byResourceTypeQb.getRawMany.mockResolvedValue([{ resourceType: 'user', count: '3' }]);

    const period = {
      dateFrom: new Date('2026-02-01T00:00:00.000Z'),
      dateTo: new Date('2026-02-28T23:59:59.999Z'),
    };

    const result = await sut.getStats(period);

    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(6);
    expect(totalQb.where).toHaveBeenCalledWith('audit.createdAt >= :dateFrom', {
      dateFrom: period.dateFrom,
    });
    expect(totalQb.andWhere).toHaveBeenCalledWith('audit.createdAt <= :dateTo', {
      dateTo: period.dateTo,
    });
    expect(failedCountQb.andWhere).toHaveBeenCalledWith('audit.success = :success', {
      success: false,
    });
    expect(topActionsQb.limit).toHaveBeenCalledWith(10);
    expect(byResourceTypeQb.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      totalLogs: 3,
      logsPerDay: [{ date: '2026-02-22', count: 2 }],
      topActions: [{ action: 'user.update', count: 3 }],
      failureRate: 33.33,
      bySeverity: [{ severity: Severity.WARNING, count: 2 }],
      byResourceType: [{ resourceType: 'user', count: 3 }],
    });
  });

  it('getStats returns zero failure rate when no logs exist', async () => {
    const qbs = Array.from({ length: 6 }, () => createQueryBuilderMock());
    (repository.createQueryBuilder as jest.Mock)
      .mockReturnValueOnce(qbs[0])
      .mockReturnValueOnce(qbs[1])
      .mockReturnValueOnce(qbs[2])
      .mockReturnValueOnce(qbs[3])
      .mockReturnValueOnce(qbs[4])
      .mockReturnValueOnce(qbs[5]);

    qbs[0].getCount.mockResolvedValue(0);
    qbs[1].getRawMany.mockResolvedValue([]);
    qbs[2].getRawMany.mockResolvedValue([]);
    qbs[3].getCount.mockResolvedValue(0);
    qbs[4].getRawMany.mockResolvedValue([]);
    qbs[5].getRawMany.mockResolvedValue([]);

    const result = await sut.getStats({
      dateFrom: new Date('2026-02-01T00:00:00.000Z'),
      dateTo: new Date('2026-02-28T23:59:59.999Z'),
    });

    expect(result.failureRate).toBe(0);
    expect(result.logsPerDay).toEqual([]);
    expect(result.topActions).toEqual([]);
  });

  it('deleteOlderThan returns affected count and falls back to zero', async () => {
    const deleteQb = createQueryBuilderMock();
    (repository.createQueryBuilder as jest.Mock).mockReturnValue(deleteQb);
    deleteQb.execute
      .mockResolvedValueOnce({ affected: 7 })
      .mockResolvedValueOnce({ affected: undefined });
    const cutoff = new Date('2025-01-01T00:00:00.000Z');

    await expect(sut.deleteOlderThan(cutoff)).resolves.toBe(7);
    await expect(sut.deleteOlderThan(cutoff)).resolves.toBe(0);

    expect(deleteQb.delete).toHaveBeenCalled();
    expect(deleteQb.from).toHaveBeenCalledWith(AdminAuditLogEntity);
    expect(deleteQb.where).toHaveBeenCalledWith('createdAt < :date', { date: cutoff });
    expect(deleteQb.execute).toHaveBeenCalledTimes(2);
  });
});
