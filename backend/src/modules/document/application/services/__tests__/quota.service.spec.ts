import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { QuotaService, UserRole } from '../quota.service';
import type { IDocumentRepository } from '../../ports/document-repository.interface';
import { DOCUMENT_REPOSITORY } from '../../ports/document-repository.interface';
import { Document } from '../../../domain/document.entity';

describe('QuotaService', () => {
  let service: QuotaService;
  let repository: jest.Mocked<IDocumentRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IDocumentRepository>> = {
      findByUserId: jest.fn(),
      sumFileSizeByUserId: jest.fn().mockResolvedValue(0),
      countByUserId: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotaService,
        {
          provide: DOCUMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<QuotaService>(QuotaService);
    repository = module.get(DOCUMENT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQuotaLimits', () => {
    it('should return correct limits for each role', () => {
      const freemiumLimits = service.getQuotaLimits('user_freemium');
      expect(freemiumLimits.maxFileSize).toBe(10 * 1024 * 1024);
      expect(freemiumLimits.maxDocumentsCount).toBe(50);

      const premiumLimits = service.getQuotaLimits('user_premium');
      expect(premiumLimits.maxFileSize).toBe(50 * 1024 * 1024);
      expect(premiumLimits.maxDocumentsCount).toBe(1000);

      const adminLimits = service.getQuotaLimits('user_admin');
      expect(adminLimits.maxDocumentsCount).toBe(-1); // unlimited
    });
  });

  describe('checkUserQuota', () => {
    it('should pass when all quotas are respected', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'user_freemium';
      const fileSize = 5 * 1024 * 1024; // 5MB

      repository.sumFileSizeByUserId.mockResolvedValue(10 * 1024 * 1024);
      repository.countByUserId.mockResolvedValue(1);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when file size exceeds limit', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'user_freemium';
      const fileSize = 15 * 1024 * 1024; // 15MB (limit is 10MB)

      repository.findByUserId.mockResolvedValue([]);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when storage limit would be exceeded', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'user_freemium';
      const fileSize = 5 * 1024 * 1024; // 5MB

      repository.sumFileSizeByUserId.mockResolvedValue(96 * 1024 * 1024);
      repository.countByUserId.mockResolvedValue(12);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserQuotaUsage', () => {
    it('should return quota usage statistics', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'user_freemium';

      repository.sumFileSizeByUserId.mockResolvedValue(25 * 1024 * 1024);
      repository.countByUserId.mockResolvedValue(2);

      const usage = await service.getUserQuotaUsage(userId, userRole);

      expect(usage.documentsCount).toBe(2);
      expect(usage.maxDocuments).toBe(50);
      expect(usage.storageUsed).toBe(25 * 1024 * 1024); // 25MB
      expect(usage.storageUsedPercent).toBe(25); // 25%
    });

    it('should return 0 percent for admin (unlimited documents)', async () => {
      const userId = 'admin-user';
      const userRole: UserRole = 'user_admin';

      repository.sumFileSizeByUserId.mockResolvedValue(5 * 1024 * 1024);
      repository.countByUserId.mockResolvedValue(1);

      const usage = await service.getUserQuotaUsage(userId, userRole);

      // Admin has -1 for maxDocuments, so documentsUsedPercent = 0
      expect(usage.documentsUsedPercent).toBe(0);
      expect(usage.maxDocuments).toBe(-1);
    });
  });

  describe('checkUserQuota - document count limit', () => {
    it('should throw ForbiddenException when document count reaches limit', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'user_freemium';
      const fileSize = 1024;

      repository.countByUserId.mockResolvedValue(50);
      repository.sumFileSizeByUserId.mockResolvedValue(50 * 1024);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not check document count for admin (unlimited)', async () => {
      const userId = 'admin-user';
      const userRole: UserRole = 'user_admin';
      const fileSize = 1024;

      repository.countByUserId.mockResolvedValue(1000);
      repository.sumFileSizeByUserId.mockResolvedValue(100 * 1000);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).resolves.not.toThrow();
    });
  });

  describe('checkUserQuota - unknown role defaults to freemium', () => {
    it('should default to freemium limits for unknown role', async () => {
      const userId = 'user-123';
      const fileSize = 5 * 1024 * 1024;

      repository.sumFileSizeByUserId.mockResolvedValue(0);
      repository.countByUserId.mockResolvedValue(0);

      // Passing an unknown role should default to freemium
      await expect(
        service.checkUserQuota(userId, 'unknown-role' as any, fileSize),
      ).resolves.not.toThrow();
    });
  });

  describe('getMaxFileSize / getMaxTotalStorage / getMaxDocumentsCount', () => {
    it('should return correct maxFileSize for each role', () => {
      expect(service.getMaxFileSize('user_freemium')).toBe(10 * 1024 * 1024);
      expect(service.getMaxFileSize('user_premium')).toBe(50 * 1024 * 1024);
      expect(service.getMaxFileSize('user_admin')).toBe(100 * 1024 * 1024);
    });

    it('should return correct maxTotalStorage for each role', () => {
      expect(service.getMaxTotalStorage('user_freemium')).toBe(100 * 1024 * 1024);
      expect(service.getMaxTotalStorage('user_premium')).toBe(10 * 1024 * 1024 * 1024);
      expect(service.getMaxTotalStorage('user_admin')).toBe(50 * 1024 * 1024 * 1024);
    });

    it('should return correct maxDocumentsCount for each role', () => {
      expect(service.getMaxDocumentsCount('user_freemium')).toBe(50);
      expect(service.getMaxDocumentsCount('user_premium')).toBe(1000);
      expect(service.getMaxDocumentsCount('user_admin')).toBe(-1);
    });
  });

  describe('canUserUpload', () => {
    it('should return canUpload=true when quota is OK', async () => {
      repository.sumFileSizeByUserId.mockResolvedValue(0);
      repository.countByUserId.mockResolvedValue(0);

      const result = await service.canUserUpload('user-123', 'user_freemium', 1024);

      expect(result.canUpload).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return canUpload=false with reason when quota exceeded', async () => {
      const fileSize = 15 * 1024 * 1024; // exceeds freemium 10MB limit
      repository.sumFileSizeByUserId.mockResolvedValue(0);
      repository.countByUserId.mockResolvedValue(0);

      const result = await service.canUserUpload('user-123', 'user_freemium', fileSize);

      expect(result.canUpload).toBe(false);
      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
    });

    it('should rethrow non-ForbiddenException errors', async () => {
      repository.sumFileSizeByUserId.mockRejectedValue(new Error('Database error'));
      repository.countByUserId.mockResolvedValue(0);

      await expect(service.canUserUpload('user-123', 'user_freemium', 1024)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(service.formatBytes(0)).toBe('0 B');
    });

    it('should format bytes (< 1024)', () => {
      expect(service.formatBytes(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(service.formatBytes(1024)).toBe('1.00 KB');
      expect(service.formatBytes(2048)).toBe('2.00 KB');
    });

    it('should format megabytes', () => {
      expect(service.formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(service.formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
    });

    it('should format gigabytes', () => {
      expect(service.formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('getUserStorageUsed', () => {
    it('should sum file sizes of all user documents', async () => {
      repository.sumFileSizeByUserId.mockResolvedValue(600);

      const result = await service.getUserStorageUsed('user-123');
      expect(result).toBe(600);
      expect(repository.sumFileSizeByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should return 0 when user has no documents', async () => {
      repository.sumFileSizeByUserId.mockResolvedValue(0);
      const result = await service.getUserStorageUsed('user-empty');
      expect(result).toBe(0);
    });
  });

  describe('getUserDocumentsCount', () => {
    it('should return the count of documents', async () => {
      repository.countByUserId.mockResolvedValue(2);

      const result = await service.getUserDocumentsCount('user-123');
      expect(result).toBe(2);
      expect(repository.countByUserId).toHaveBeenCalledWith('user-123');
    });
  });
});

// Helper function to create mock documents
function createMockDocument(id: string, userId: string, fileSize: number): Document {
  return new Document({
    id,
    userId,
    filename: `test-${id}.pdf`,
    r2Key: `users/${userId}/documents/${id}.pdf`,
    r2Bucket: 'remindy-documents',
    fileHash: 'mock-hash',
    fileSize,
    mimeType: 'application/pdf',
    ocrStatus: 'completed',
    uploadedAt: new Date(),
    updatedAt: new Date(),
  });
}
