import { Test, TestingModule } from '@nestjs/testing';
import { StorageQuotaService } from './storage-quota.service';
import type { IDocumentRepository } from '../document/application/ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../document/application/ports/document-repository.interface';
import { Role } from '../auth/domain/value-objects/role.enum';

describe('StorageQuotaService', () => {
  let service: StorageQuotaService;
  let documentRepo: jest.Mocked<IDocumentRepository>;

  const mockStorage = (totalBytes: number, count: number = 1) => {
    documentRepo.sumFileSizeByUserId.mockResolvedValue(totalBytes);
    documentRepo.countByUserId.mockResolvedValue(count);
  };

  beforeEach(async () => {
    const mockDocumentRepo: Partial<jest.Mocked<IDocumentRepository>> = {
      findByUserId: jest.fn(),
      sumFileSizeByUserId: jest.fn(),
      countByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageQuotaService,
        { provide: DOCUMENT_REPOSITORY, useValue: mockDocumentRepo },
      ],
    }).compile();

    service = module.get<StorageQuotaService>(StorageQuotaService);
    documentRepo = module.get(DOCUMENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuota()', () => {
    it('should compute quota for freemium user correctly', async () => {
      const freemiumTotal = 100 * 1024 * 1024;
      mockStorage(30 * 1024 * 1024, 2);

      const quota = await service.getQuota('user-1', Role.USER_FREEMIUM);

      expect(quota.totalBytes).toBe(freemiumTotal);
      expect(quota.usedBytes).toBe(30 * 1024 * 1024);
      expect(quota.availableBytes).toBe(freemiumTotal - 30 * 1024 * 1024);
      expect(quota.documentCount).toBe(2);
      expect(quota.usagePercentage).toBeGreaterThan(0);
      expect(quota.totalFormatted).toBe('100 MB');
      expect(quota.usedFormatted).toContain('MB');
      expect(quota.availableFormatted).toContain('MB');
    });

    it('should compute quota for premium user', async () => {
      const premiumTotal = 10 * 1024 * 1024 * 1024;
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', Role.USER_PREMIUM);

      expect(quota.totalBytes).toBe(premiumTotal);
      expect(quota.usedBytes).toBe(0);
      expect(quota.availableBytes).toBe(premiumTotal);
      expect(quota.usagePercentage).toBe(0);
      expect(quota.documentCount).toBe(0);
    });

    it('should compute quota for admin user', async () => {
      const adminTotal = 50 * 1024 * 1024 * 1024;
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', Role.USER_ADMIN);

      expect(quota.totalBytes).toBe(adminTotal);
    });

    it('should compute quota for super_admin', async () => {
      const superTotal = 50 * 1024 * 1024 * 1024;
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', Role.SUPER_ADMIN);

      expect(quota.totalBytes).toBe(superTotal);
    });

    it('should default to freemium quota for unknown role', async () => {
      const freemiumTotal = 100 * 1024 * 1024;
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', 'unknown_role');

      expect(quota.totalBytes).toBe(freemiumTotal);
    });

    it('should default to freemium quota when role is undefined', async () => {
      const freemiumTotal = 100 * 1024 * 1024;
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', undefined);

      expect(quota.totalBytes).toBe(freemiumTotal);
    });

    it('should cap availableBytes at 0 when usedBytes exceeds total', async () => {
      mockStorage(200 * 1024 * 1024, 1);

      const quota = await service.getQuota('user-1', Role.USER_FREEMIUM);

      expect(quota.availableBytes).toBe(0);
    });

    it('should propagate errors from document repository', async () => {
      documentRepo.sumFileSizeByUserId.mockRejectedValue(new Error('DB error'));
      documentRepo.countByUserId.mockResolvedValue(0);

      await expect(service.getQuota('user-1', Role.USER_FREEMIUM)).rejects.toThrow('DB error');
    });
  });

  describe('canUpload()', () => {
    it('should return true when there is enough space', async () => {
      mockStorage(0, 0);

      const result = await service.canUpload('user-1', 1024, Role.USER_FREEMIUM);

      expect(result).toBe(true);
    });

    it('should return false when there is not enough space', async () => {
      mockStorage(100 * 1024 * 1024, 1);

      const result = await service.canUpload('user-1', 1, Role.USER_FREEMIUM);

      expect(result).toBe(false);
    });

    it('should propagate errors', async () => {
      documentRepo.sumFileSizeByUserId.mockRejectedValue(new Error('DB error'));
      documentRepo.countByUserId.mockResolvedValue(0);

      await expect(service.canUpload('user-1', 1024, Role.USER_FREEMIUM)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getAvailableSpace()', () => {
    it('should return the available bytes', async () => {
      mockStorage(10 * 1024 * 1024, 1);

      const available = await service.getAvailableSpace('user-1', Role.USER_FREEMIUM);

      expect(available).toBe(90 * 1024 * 1024);
    });

    it('should propagate errors', async () => {
      documentRepo.sumFileSizeByUserId.mockRejectedValue(new Error('DB error'));
      documentRepo.countByUserId.mockResolvedValue(0);

      await expect(service.getAvailableSpace('user-1', Role.USER_FREEMIUM)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getQuotaForRole()', () => {
    it('should return correct quota for freemium', () => {
      expect(service.getQuotaForRole(Role.USER_FREEMIUM)).toBe(100 * 1024 * 1024);
    });

    it('should return correct quota for premium', () => {
      expect(service.getQuotaForRole(Role.USER_PREMIUM)).toBe(10 * 1024 * 1024 * 1024);
    });

    it('should return freemium quota for unknown role', () => {
      expect(service.getQuotaForRole('unknown')).toBe(100 * 1024 * 1024);
    });
  });

  describe('formatBytes (via getQuota)', () => {
    it('should format 0 bytes as "0 Bytes"', async () => {
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', Role.USER_FREEMIUM);

      expect(quota.usedFormatted).toBe('0 Bytes');
    });

    it('should format KB-range values correctly', async () => {
      mockStorage(512, 1);

      const quota = await service.getQuota('user-1', Role.USER_FREEMIUM);

      expect(quota.usedFormatted).toContain('Bytes');
    });

    it('should format GB-range values', async () => {
      mockStorage(0, 0);

      const quota = await service.getQuota('user-1', Role.USER_PREMIUM);

      expect(quota.totalFormatted).toContain('GB');
    });
  });
});
