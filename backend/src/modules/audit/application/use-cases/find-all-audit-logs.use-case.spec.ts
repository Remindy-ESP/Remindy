import { Test, TestingModule } from '@nestjs/testing';
import { FindAllAuditLogsUseCase } from './find-all-audit-logs.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { Severity } from '../../domain/enums/severity.enum';
import { AuditLogFilterDto } from '../dto/audit-log-filter.dto';

describe('FindAllAuditLogsUseCase', () => {
  let useCase: FindAllAuditLogsUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;

  const mockAuditLog = AuditLog.fromProps({
    id: 'audit-123',
    actorUserId: 'user-123',
    action: 'user.ban',
    resourceType: 'user',
    resourceId: 'target-456',
    before: { status: 'active' },
    after: { status: 'banned' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    severity: Severity.WARNING,
    success: true,
    errorMessage: null,
    createdAt: new Date('2025-01-01'),
  });

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IAuditLogRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllAuditLogsUseCase,
        {
          provide: IAuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllAuditLogsUseCase>(FindAllAuditLogsUseCase);
    repository = module.get(IAuditLogRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return paginated audit logs', async () => {
    const filter: AuditLogFilterDto = {
      page: 1,
      limit: 20,
    };

    repository.findAll.mockResolvedValue({
      data: [mockAuditLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const result = await useCase.execute(filter);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(result.data[0].id).toBe('audit-123');
  });

  it('should apply default pagination values', async () => {
    const filter: AuditLogFilterDto = {};

    repository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await useCase.execute(filter);

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }),
    );
  });

  it('should filter by action', async () => {
    const filter: AuditLogFilterDto = {
      action: 'user.ban',
    };

    repository.findAll.mockResolvedValue({
      data: [mockAuditLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    await useCase.execute(filter);

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.ban',
      }),
    );
  });

  it('should filter by severity', async () => {
    const filter: AuditLogFilterDto = {
      severity: Severity.CRITICAL,
    };

    repository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await useCase.execute(filter);

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: Severity.CRITICAL,
      }),
    );
  });

  it('should filter by date range', async () => {
    const dateFrom = new Date('2025-01-01');
    const dateTo = new Date('2025-01-31');
    const filter: AuditLogFilterDto = {
      dateFrom,
      dateTo,
    };

    repository.findAll.mockResolvedValue({
      data: [mockAuditLog],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    await useCase.execute(filter);

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom,
        dateTo,
      }),
    );
  });

  it('should return empty array when no logs found', async () => {
    repository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const result = await useCase.execute({});

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
