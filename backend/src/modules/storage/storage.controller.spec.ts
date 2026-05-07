import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StorageController } from './storage.controller';
import { StorageQuotaService, StorageQuota } from './storage-quota.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('StorageController', () => {
  let controller: StorageController;
  let storageQuotaService: jest.Mocked<StorageQuotaService>;

  const mockQuota: StorageQuota = {
    totalBytes: 100 * 1024 * 1024,
    usedBytes: 20 * 1024 * 1024,
    availableBytes: 80 * 1024 * 1024,
    usagePercentage: 20,
    documentCount: 5,
    totalFormatted: '100 MB',
    usedFormatted: '20 MB',
    availableFormatted: '80 MB',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageQuotaService,
          useValue: { getQuota: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StorageController>(StorageController);
    storageQuotaService = module.get(StorageQuotaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuota()', () => {
    it('should call StorageQuotaService.getQuota with userId and role', async () => {
      (storageQuotaService.getQuota as jest.Mock).mockResolvedValue(mockQuota);

      const result = await controller.getQuota('user-1', 'user_freemium');

      expect(storageQuotaService.getQuota).toHaveBeenCalledWith('user-1', 'user_freemium');
      expect(result).toEqual(mockQuota);
    });

    it('should return the full quota object', async () => {
      (storageQuotaService.getQuota as jest.Mock).mockResolvedValue(mockQuota);

      const result = await controller.getQuota('user-2', 'user_premium');

      expect(result.totalBytes).toBe(100 * 1024 * 1024);
      expect(result.usedBytes).toBe(20 * 1024 * 1024);
      expect(result.documentCount).toBe(5);
      expect(result.totalFormatted).toBe('100 MB');
    });

    it('should propagate errors from service', async () => {
      (storageQuotaService.getQuota as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.getQuota('user-1', 'user_freemium')).rejects.toThrow('Service error');
    });
  });
});
