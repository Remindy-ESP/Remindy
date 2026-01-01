import { Test, TestingModule } from '@nestjs/testing';
import { ExportAuditLogsUseCase } from './export-audit-logs.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { IAuditExportService } from '../ports/audit-export.service';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { Severity } from '../../domain/enums/severity.enum';

describe('ExportAuditLogsUseCase', () => {
  let useCase: ExportAuditLogsUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;
  let exportService: jest.Mocked<IAuditExportService>;

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
      findAllForExport: jest.fn(),
    };

    const mockExportService: jest.Mocked<IAuditExportService> = {
      toCsv: jest.fn(),
      toJson: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportAuditLogsUseCase,
        {
          provide: IAuditLogRepository,
          useValue: mockRepository,
        },
        {
          provide: IAuditExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    useCase = module.get<ExportAuditLogsUseCase>(ExportAuditLogsUseCase);
    repository = module.get(IAuditLogRepository);
    exportService = module.get(IAuditExportService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should export as JSON by default', async () => {
    repository.findAllForExport.mockResolvedValue([mockAuditLog]);
    exportService.toJson.mockReturnValue('[{"id":"audit-123"}]');

    const result = await useCase.execute({ format: 'json' });

    expect(result.contentType).toBe('application/json');
    expect(exportService.toJson).toHaveBeenCalledWith([mockAuditLog]);
    expect(exportService.toCsv).not.toHaveBeenCalled();
  });

  it('should export as CSV when format is csv', async () => {
    repository.findAllForExport.mockResolvedValue([mockAuditLog]);
    exportService.toCsv.mockReturnValue('id,action\naudit-123,user.ban');

    const result = await useCase.execute({ format: 'csv' });

    expect(result.contentType).toBe('text/csv');
    expect(exportService.toCsv).toHaveBeenCalledWith([mockAuditLog]);
    expect(exportService.toJson).not.toHaveBeenCalled();
  });

  it('should pass filters to repository', async () => {
    const filters = {
      format: 'json' as const,
      actorUserId: 'user-123',
      action: 'user.ban',
      resourceType: 'user',
      severity: Severity.WARNING,
      success: true,
      dateFrom: new Date('2025-01-01'),
      dateTo: new Date('2025-01-31'),
      search: 'ban',
    };

    repository.findAllForExport.mockResolvedValue([]);
    exportService.toJson.mockReturnValue('[]');

    await useCase.execute(filters);

    expect(repository.findAllForExport).toHaveBeenCalledWith({
      actorUserId: 'user-123',
      action: 'user.ban',
      resourceType: 'user',
      severity: Severity.WARNING,
      success: true,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: 'ban',
    });
  });

  it('should return CSV data string', async () => {
    const csvData = 'id,action,resourceType\naudit-123,user.ban,user';
    repository.findAllForExport.mockResolvedValue([mockAuditLog]);
    exportService.toCsv.mockReturnValue(csvData);

    const result = await useCase.execute({ format: 'csv' });

    expect(result.data).toBe(csvData);
  });

  it('should return JSON data string', async () => {
    const jsonData = JSON.stringify([{ id: 'audit-123', action: 'user.ban' }]);
    repository.findAllForExport.mockResolvedValue([mockAuditLog]);
    exportService.toJson.mockReturnValue(jsonData);

    const result = await useCase.execute({ format: 'json' });

    expect(result.data).toBe(jsonData);
  });
});
