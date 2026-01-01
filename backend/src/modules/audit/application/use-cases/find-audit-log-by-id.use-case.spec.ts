import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FindAuditLogByIdUseCase } from './find-audit-log-by-id.use-case';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { Severity } from '../../domain/enums/severity.enum';
import { createMockAuditLog } from '../../test/audit-log.factory';

describe('FindAuditLogByIdUseCase', () => {
  let useCase: FindAuditLogByIdUseCase;
  let repository: jest.Mocked<IAuditLogRepository>;

  const mockAuditLog = createMockAuditLog();

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IAuditLogRepository>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAuditLogByIdUseCase,
        {
          provide: IAuditLogRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<FindAuditLogByIdUseCase>(FindAuditLogByIdUseCase);
    repository = module.get(IAuditLogRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return audit log when found', async () => {
    repository.findById.mockResolvedValue(mockAuditLog);

    const result = await useCase.execute('audit-123');

    expect(result.id).toBe('audit-123');
    expect(result.action).toBe('user.ban');
    expect(result.resourceType).toBe('user');
    expect(repository.findById).toHaveBeenCalledWith('audit-123');
  });

  it('should throw NotFoundException when audit log not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundException);
    await expect(useCase.execute('non-existent-id')).rejects.toThrow(
      'Audit log with ID non-existent-id not found',
    );
  });

  it('should return all audit log fields', async () => {
    repository.findById.mockResolvedValue(mockAuditLog);

    const result = await useCase.execute('audit-123');

    expect(result).toEqual({
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
      createdAt: expect.any(Date),
    });
  });
});
