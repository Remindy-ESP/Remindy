import { Test, TestingModule } from '@nestjs/testing';
import { CreateAuditLogUseCase } from './create-audit-log.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { Severity } from '../../domain/enums/severity.enum';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';

describe('CreateAuditLogUseCase', () => {
  let useCase: CreateAuditLogUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IAuditLogRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAuditLogUseCase,
        {
          provide: IAuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateAuditLogUseCase>(CreateAuditLogUseCase);
    repository = module.get(IAuditLogRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create an audit log successfully', async () => {
    const dto: CreateAuditLogDto = {
      actorUserId: 'user-123',
      action: 'user.ban',
      resourceType: 'user',
      resourceId: 'target-user-456',
      before: { status: 'active' },
      after: { status: 'banned' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      severity: Severity.WARNING,
      success: true,
    };

    const expectedLog = AuditLog.fromProps({
      id: 'audit-123',
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      before: dto.before ?? null,
      after: dto.after ?? null,
      ipAddress: dto.ipAddress ?? null,
      userAgent: dto.userAgent ?? null,
      severity: dto.severity ?? Severity.INFO,
      success: dto.success ?? true,
      errorMessage: null,
      createdAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedLog);

    const result = await useCase.execute(dto);

    expect(result.id).toBe('audit-123');
    expect(result.action).toBe('user.ban');
    expect(result.resourceType).toBe('user');
    expect(result.severity).toBe(Severity.WARNING);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('should create audit log with default severity INFO', async () => {
    const dto: CreateAuditLogDto = {
      actorUserId: 'user-123',
      action: 'user.view',
      resourceType: 'user',
    };

    const expectedLog = AuditLog.fromProps({
      id: 'audit-456',
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: null,
      before: null,
      after: null,
      ipAddress: null,
      userAgent: null,
      severity: Severity.INFO,
      success: true,
      errorMessage: null,
      createdAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedLog);

    const result = await useCase.execute(dto);

    expect(result.severity).toBe(Severity.INFO);
    expect(result.success).toBe(true);
  });

  it('should create audit log with error message on failure', async () => {
    const dto: CreateAuditLogDto = {
      actorUserId: 'user-123',
      action: 'user.delete',
      resourceType: 'user',
      resourceId: 'target-789',
      success: false,
      errorMessage: 'User not found',
      severity: Severity.CRITICAL,
    };

    const expectedLog = AuditLog.fromProps({
      id: 'audit-789',
      actorUserId: dto.actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId ?? null,
      before: null,
      after: null,
      ipAddress: null,
      userAgent: null,
      severity: Severity.CRITICAL,
      success: false,
      errorMessage: 'User not found',
      createdAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedLog);

    const result = await useCase.execute(dto);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('User not found');
    expect(result.severity).toBe(Severity.CRITICAL);
  });

  it('should create audit log with null actorUserId for system actions', async () => {
    const dto: CreateAuditLogDto = {
      actorUserId: null,
      action: 'system.cleanup',
      resourceType: 'sessions',
    };

    const expectedLog = AuditLog.fromProps({
      id: 'audit-system',
      actorUserId: null,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: null,
      before: null,
      after: null,
      ipAddress: null,
      userAgent: null,
      severity: Severity.INFO,
      success: true,
      errorMessage: null,
      createdAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedLog);

    const result = await useCase.execute(dto);

    expect(result.actorUserId).toBeNull();
    expect(result.action).toBe('system.cleanup');
  });
});
