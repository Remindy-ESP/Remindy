import { Test, TestingModule } from '@nestjs/testing';
import { PurgeAuditLogsUseCase } from './purge-audit-logs.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';

describe('PurgeAuditLogsUseCase', () => {
  let useCase: PurgeAuditLogsUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurgeAuditLogsUseCase,
        {
          provide: IAuditLogRepository,
          useValue: {
            deleteOlderThan: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(PurgeAuditLogsUseCase);
    repository = module.get(IAuditLogRepository);
    repository.deleteOlderThan.mockResolvedValue(0);

    delete process.env.AUDIT_LOG_RETENTION_DAYS;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.AUDIT_LOG_RETENTION_DAYS;
  });

  it('should purge using default retention when env is not set', async () => {
    const now = new Date('2026-02-22T12:00:00.000Z');
    repository.deleteOlderThan.mockResolvedValue(12);

    const result = await useCase.execute({ now });

    expect(repository.deleteOlderThan).toHaveBeenCalledWith(new Date('2025-11-24T12:00:00.000Z'));
    expect(result).toEqual({
      deletedCount: 12,
      cutoffDate: new Date('2025-11-24T12:00:00.000Z'),
      retentionDays: 90,
    });
  });

  it('should use explicit retentionDays override when provided', async () => {
    const now = new Date('2026-02-22T00:00:00.000Z');

    await useCase.execute({ now, retentionDays: 30 });

    expect(repository.deleteOlderThan).toHaveBeenCalledWith(new Date('2026-01-23T00:00:00.000Z'));
  });

  it('should use AUDIT_LOG_RETENTION_DAYS from env', async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = '180';
    const now = new Date('2026-02-22T00:00:00.000Z');

    const result = await useCase.execute({ now });

    expect(result.retentionDays).toBe(180);
    expect(repository.deleteOlderThan).toHaveBeenCalledWith(new Date('2025-08-26T00:00:00.000Z'));
  });

  it('should return zero when nothing is deleted', async () => {
    repository.deleteOlderThan.mockResolvedValue(0);
    const result = await useCase.execute({ now: new Date('2026-02-22T00:00:00.000Z') });

    expect(result.deletedCount).toBe(0);
  });

  it('should throw when retention override is invalid', async () => {
    await expect(useCase.execute({ retentionDays: 0 })).rejects.toThrow(
      'AUDIT_LOG_RETENTION_DAYS must be a positive integer',
    );

    expect(repository.deleteOlderThan).not.toHaveBeenCalled();
  });

  it('should throw when env retention value is invalid', async () => {
    process.env.AUDIT_LOG_RETENTION_DAYS = 'abc';

    await expect(useCase.execute()).rejects.toThrow(
      'AUDIT_LOG_RETENTION_DAYS must be a positive integer',
    );

    expect(repository.deleteOlderThan).not.toHaveBeenCalled();
  });
});
