import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { FindAllAuditLogsUseCase } from '../../application/use-cases/find-all-audit-logs.use-case';
import { FindAuditLogByIdUseCase } from '../../application/use-cases/find-audit-log-by-id.use-case';
import { GetAuditStatsUseCase } from '../../application/use-cases/get-audit-stats.use-case';
import { ExportAuditLogsUseCase } from '../../application/use-cases/export-audit-logs.use-case';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/presentation/guards/roles.guard';
import { MfaRequiredGuard } from '../guards/mfa-required.guard';
import { Severity } from '../../domain/enums/severity.enum';
import { CreateAuditLogRequestDto } from '../dto/create-audit-log.request.dto';
import { AuditLogFilterRequestDto } from '../dto/audit-log-filter.request.dto';
import { createMockAuditLogResponse } from '../../test/audit-log.factory';
import type { Response } from 'express';

describe('AuditController', () => {
  let controller: AuditController;
  let createAuditLogUseCase: jest.Mocked<CreateAuditLogUseCase>;
  let findAllAuditLogsUseCase: jest.Mocked<FindAllAuditLogsUseCase>;
  let findAuditLogByIdUseCase: jest.Mocked<FindAuditLogByIdUseCase>;
  let getAuditStatsUseCase: jest.Mocked<GetAuditStatsUseCase>;
  let exportAuditLogsUseCase: jest.Mocked<ExportAuditLogsUseCase>;

  const mockUser = {
    userId: 'admin-123',
    role: 'user_admin',
  };

  const mockRequest = {
    user: mockUser,
    headers: {
      'user-agent': 'Mozilla/5.0 Test',
      'x-forwarded-for': '127.0.0.1',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
    ip: '127.0.0.1',
  } as any;

  const mockAuditLogResponse = createMockAuditLogResponse({
    actorUserId: 'admin-123',
    userAgent: 'Mozilla/5.0 Test',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: CreateAuditLogUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindAllAuditLogsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindAuditLogByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAuditStatsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ExportAuditLogsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(MfaRequiredGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
    createAuditLogUseCase = module.get(CreateAuditLogUseCase);
    findAllAuditLogsUseCase = module.get(FindAllAuditLogsUseCase);
    findAuditLogByIdUseCase = module.get(FindAuditLogByIdUseCase);
    getAuditStatsUseCase = module.get(GetAuditStatsUseCase);
    exportAuditLogsUseCase = module.get(ExportAuditLogsUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new audit log', async () => {
      const createDto: CreateAuditLogRequestDto = {
        action: 'user.ban',
        resourceType: 'user',
        resourceId: 'target-456',
        before: { status: 'active' },
        after: { status: 'banned' },
        severity: Severity.WARNING,
      };

      createAuditLogUseCase.execute.mockResolvedValue(mockAuditLogResponse);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('audit-123');
      expect(result.action).toBe('user.ban');
      expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          actorUserId: 'admin-123',
          action: 'user.ban',
          resourceType: 'user',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test',
        }),
      );
    });

    it('should extract IP from x-forwarded-for header', async () => {
      const createDto: CreateAuditLogRequestDto = {
        action: 'user.view',
        resourceType: 'user',
      };

      createAuditLogUseCase.execute.mockResolvedValue(mockAuditLogResponse);

      await controller.create(mockRequest, createDto);

      expect(createAuditLogUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '127.0.0.1',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const filter: AuditLogFilterRequestDto = {
        page: 1,
        limit: 20,
      };

      const paginatedResponse = {
        data: [mockAuditLogResponse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      findAllAuditLogsUseCase.execute.mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(filter);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(findAllAuditLogsUseCase.execute).toHaveBeenCalled();
    });

    it('should pass filters to use case', async () => {
      const filter: AuditLogFilterRequestDto = {
        action: 'user.ban',
        severity: Severity.WARNING,
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        page: 1,
        limit: 10,
      };

      findAllAuditLogsUseCase.execute.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      await controller.findAll(filter);

      expect(findAllAuditLogsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.ban',
          severity: Severity.WARNING,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return audit log by id', async () => {
      findAuditLogByIdUseCase.execute.mockResolvedValue(mockAuditLogResponse);

      const result = await controller.findOne('audit-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('audit-123');
      expect(findAuditLogByIdUseCase.execute).toHaveBeenCalledWith('audit-123');
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      const statsResponse = {
        totalLogs: 100,
        logsPerDay: [{ date: '2025-01-01', count: 50 }],
        topActions: [{ action: 'user.login', count: 40 }],
        failureRate: 5.5,
        bySeverity: [{ severity: Severity.INFO, count: 80 }],
        byResourceType: [{ resourceType: 'user', count: 60 }],
      };

      getAuditStatsUseCase.execute.mockResolvedValue(statsResponse);

      const result = await controller.getStats({});

      expect(result).toBeDefined();
      expect(result.totalLogs).toBe(100);
      expect(result.failureRate).toBe(5.5);
    });

    it('should use default 30 days when no date range provided', async () => {
      getAuditStatsUseCase.execute.mockResolvedValue({
        totalLogs: 0,
        logsPerDay: [],
        topActions: [],
        failureRate: 0,
        bySeverity: [],
        byResourceType: [],
      });

      await controller.getStats({});

      expect(getAuditStatsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date),
        }),
      );
    });
  });

  describe('export', () => {
    it('should export audit logs as JSON', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      exportAuditLogsUseCase.execute.mockResolvedValue({
        data: '[{"id":"audit-123"}]',
        contentType: 'application/json',
      });

      await controller.export({ format: 'json' }, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="audit-logs-'),
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export audit logs as CSV', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      exportAuditLogsUseCase.execute.mockResolvedValue({
        data: 'id,action\naudit-123,user.ban',
        contentType: 'text/csv',
      });

      await controller.export({ format: 'csv' }, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('.csv'),
      );
    });
  });
});
