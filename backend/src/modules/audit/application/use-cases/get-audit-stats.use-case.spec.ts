import { Test, TestingModule } from '@nestjs/testing';
import { GetAuditStatsUseCase } from './get-audit-stats.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { Severity } from '../../domain/enums/severity.enum';

describe('GetAuditStatsUseCase', () => {
  let useCase: GetAuditStatsUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;

  const mockStats = {
    totalLogs: 100,
    logsPerDay: [
      { date: '2025-01-01', count: 50 },
      { date: '2025-01-02', count: 50 },
    ],
    topActions: [
      { action: 'user.login', count: 40 },
      { action: 'user.ban', count: 30 },
      { action: 'user.update', count: 30 },
    ],
    failureRate: 5.5,
    bySeverity: [
      { severity: Severity.INFO, count: 80 },
      { severity: Severity.WARNING, count: 15 },
      { severity: Severity.CRITICAL, count: 5 },
    ],
    byResourceType: [
      { resourceType: 'user', count: 60 },
      { resourceType: 'subscription', count: 40 },
    ],
  };

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IAuditLogRepository>> = {
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAuditStatsUseCase,
        {
          provide: IAuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAuditStatsUseCase>(GetAuditStatsUseCase);
    repository = module.get(IAuditLogRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return audit statistics', async () => {
    const dateFrom = new Date('2025-01-01');
    const dateTo = new Date('2025-01-31');

    repository.getStats.mockResolvedValue(mockStats);

    const result = await useCase.execute({ dateFrom, dateTo });

    expect(result.totalLogs).toBe(100);
    expect(result.logsPerDay).toHaveLength(2);
    expect(result.topActions).toHaveLength(3);
    expect(result.failureRate).toBe(5.5);
    expect(result.bySeverity).toHaveLength(3);
    expect(result.byResourceType).toHaveLength(2);
  });

  it('should pass date range to repository', async () => {
    const dateFrom = new Date('2025-01-01');
    const dateTo = new Date('2025-01-31');

    repository.getStats.mockResolvedValue(mockStats);

    await useCase.execute({ dateFrom, dateTo });

    expect(repository.getStats).toHaveBeenCalledWith({
      dateFrom,
      dateTo,
    });
  });

  it('should return correct failure rate', async () => {
    repository.getStats.mockResolvedValue({
      ...mockStats,
      failureRate: 10.25,
    });

    const result = await useCase.execute({
      dateFrom: new Date(),
      dateTo: new Date(),
    });

    expect(result.failureRate).toBe(10.25);
  });

  it('should return empty arrays when no data', async () => {
    repository.getStats.mockResolvedValue({
      totalLogs: 0,
      logsPerDay: [],
      topActions: [],
      failureRate: 0,
      bySeverity: [],
      byResourceType: [],
    });

    const result = await useCase.execute({
      dateFrom: new Date(),
      dateTo: new Date(),
    });

    expect(result.totalLogs).toBe(0);
    expect(result.logsPerDay).toEqual([]);
    expect(result.topActions).toEqual([]);
    expect(result.failureRate).toBe(0);
  });
});
