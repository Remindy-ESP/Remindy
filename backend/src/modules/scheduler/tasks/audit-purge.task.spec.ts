import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditPurgeTask } from './audit-purge.task';
import { PurgeAuditLogsUseCase } from '../../audit/application/use-cases/purge-audit-logs.use-case';

describe('AuditPurgeTask', () => {
  let task: AuditPurgeTask;
  let purgeAuditLogsUseCase: jest.Mocked<PurgeAuditLogsUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditPurgeTask,
        {
          provide: PurgeAuditLogsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    task = module.get(AuditPurgeTask);
    purgeAuditLogsUseCase = module.get(PurgeAuditLogsUseCase);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should run cron purge and log result', async () => {
    purgeAuditLogsUseCase.execute.mockResolvedValue({
      deletedCount: 42,
      cutoffDate: new Date('2025-01-01T00:00:00.000Z'),
      retentionDays: 90,
    });

    await task.handleCron();

    expect(purgeAuditLogsUseCase.execute).toHaveBeenCalledWith();
    expect(Logger.prototype.log).toHaveBeenCalledWith('Starting audit purge task...');
    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('Deleted 42 logs older than 2025-01-01T00:00:00.000Z'),
    );
  });

  it('should handle purge errors gracefully in cron', async () => {
    purgeAuditLogsUseCase.execute.mockRejectedValue(new Error('DB error'));

    await task.handleCron();

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining('Audit purge task failed'),
    );
  });

  it('should trigger purge manually and return result', async () => {
    const now = new Date('2026-02-22T00:00:00.000Z');
    const result = {
      deletedCount: 3,
      cutoffDate: new Date('2026-01-23T00:00:00.000Z'),
      retentionDays: 30,
    };
    purgeAuditLogsUseCase.execute.mockResolvedValue(result);

    const response = await task.triggerManually({ retentionDays: 30, now });

    expect(Logger.prototype.log).toHaveBeenCalledWith('Manually triggering audit purge...');
    expect(purgeAuditLogsUseCase.execute).toHaveBeenCalledWith({ retentionDays: 30, now });
    expect(response).toEqual(result);
  });
});
