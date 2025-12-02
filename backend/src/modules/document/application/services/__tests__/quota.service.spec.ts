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
      const freemiumLimits = service.getQuotaLimits('freemium');
      expect(freemiumLimits.maxFileSize).toBe(10 * 1024 * 1024);
      expect(freemiumLimits.maxDocumentsCount).toBe(50);

      const premiumLimits = service.getQuotaLimits('premium');
      expect(premiumLimits.maxFileSize).toBe(50 * 1024 * 1024);
      expect(premiumLimits.maxDocumentsCount).toBe(1000);

      const adminLimits = service.getQuotaLimits('admin');
      expect(adminLimits.maxDocumentsCount).toBe(-1); // unlimited
    });
  });

  describe('checkUserQuota', () => {
    it('should pass when all quotas are respected', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'freemium';
      const fileSize = 5 * 1024 * 1024; // 5MB

      const mockDocuments = [createMockDocument('doc-1', userId, 10 * 1024 * 1024)];
      repository.findByUserId.mockResolvedValue(mockDocuments);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when file size exceeds limit', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'freemium';
      const fileSize = 15 * 1024 * 1024; // 15MB (limit is 10MB)

      repository.findByUserId.mockResolvedValue([]);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when storage limit would be exceeded', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'freemium';
      const fileSize = 5 * 1024 * 1024; // 5MB

      // User already has 96MB stored (limit is 100MB)
      const mockDocuments = Array(12)
        .fill(null)
        .map((_, i) => createMockDocument(`doc-${i}`, userId, 8 * 1024 * 1024));

      repository.findByUserId.mockResolvedValue(mockDocuments);

      await expect(service.checkUserQuota(userId, userRole, fileSize)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserQuotaUsage', () => {
    it('should return quota usage statistics', async () => {
      const userId = 'user-123';
      const userRole: UserRole = 'freemium';

      const mockDocuments = [
        createMockDocument('doc-1', userId, 10 * 1024 * 1024), // 10MB
        createMockDocument('doc-2', userId, 15 * 1024 * 1024), // 15MB
      ];

      repository.findByUserId.mockResolvedValue(mockDocuments);

      const usage = await service.getUserQuotaUsage(userId, userRole);

      expect(usage.documentsCount).toBe(2);
      expect(usage.maxDocuments).toBe(50);
      expect(usage.storageUsed).toBe(25 * 1024 * 1024); // 25MB
      expect(usage.storageUsedPercent).toBe(25); // 25%
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
