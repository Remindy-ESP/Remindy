import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';

import { DocumentController } from '../src/modules/document/presentation/controllers/document.controller';
import { UploadDocumentUseCase } from '../src/modules/document/application/use-cases/upload-document.use-case';
import { FindAllDocumentsUseCase } from '../src/modules/document/application/use-cases/find-all-documents.use-case';
import { DeleteDocumentUseCase } from '../src/modules/document/application/use-cases/delete-document.use-case';
import { ReprocessOcrUseCase } from '../src/modules/document/application/use-cases/reprocess-ocr.use-case';
import { UpdateDocumentUseCase } from '../src/modules/document/application/use-cases/update-document.use-case';
import { CloudflareR2Service } from '../src/modules/document/infrastructure/services/cloudflare-r2.service';
import { DOCUMENT_REPOSITORY } from '../src/modules/document/application/ports/document-repository.interface';
import { QuotaService } from '../src/modules/document/application/services/quota.service';
import { InMemoryQueueService } from '../src/modules/document/infrastructure/queue/in-memory-queue.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const VALID_DOC_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_JOB_ID = 'job-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const VALID_SUB_ID = '00000000-0000-4000-8000-000000000002';

// TestJwtAuthGuard mirrors the real guard's test-mode behaviour but without
// any Passport / AuthGuard('jwt') dependency that requires a live strategy.
class TestJwtAuthGuard implements CanActivate {
  private readonly TOKEN_MAP: Record<string, { id: string; userId: string; role: string }> = {
    'user-token': { id: TEST_USER_ID, userId: TEST_USER_ID, role: 'USER_PREMIUM' },
  };

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    const token = authHeader.slice(7);
    const payload = this.TOKEN_MAP[token];
    if (!payload) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    req.user = payload;
    return true;
  }
}

const sampleDocument = {
  id: VALID_DOC_ID,
  userId: TEST_USER_ID,
  subscriptionId: VALID_SUB_ID,
  filename: 'test-document.pdf',
  r2Key: 'documents/test-document.pdf',
  r2Bucket: 'remindy-docs',
  fileHash: 'abc123hash',
  fileSize: 1024,
  mimeType: 'application/pdf',
  ocrStatus: 'pending' as const,
  uploadedAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

describe('DocumentController (e2e)', () => {
  let app: INestApplication;

  const uploadDocumentUseCase = { execute: jest.fn() };
  const findAllDocumentsUseCase = { execute: jest.fn() };
  const deleteDocumentUseCase = { execute: jest.fn() };
  const reprocessOcrUseCase = { execute: jest.fn() };
  const updateDocumentUseCase = { execute: jest.fn() };
  const r2Service = { downloadFile: jest.fn(), uploadFile: jest.fn(), deleteFile: jest.fn() };
  const documentRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const quotaService = {
    getUserQuotaUsage: jest.fn(),
    formatBytes: jest.fn(),
    checkUserQuota: jest.fn(),
  };
  const queueService = { getQueueStats: jest.fn(), getJobStatus: jest.fn(), addJob: jest.fn() };

  const authHeader = () => ({ Authorization: 'Bearer user-token' });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // FileInterceptor relies on MulterModule for the file-size limit
        // (in prod this lives in DocumentModule); enforce the 10MB cap the
        // oversized-upload test expects.
        MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
      ],
      controllers: [DocumentController],
      providers: [
        // Reflector is required by JwtAuthGuard constructor
        Reflector,
        // Provide JwtAuthGuard as our test double so NestJS DI resolves it
        // without trying to instantiate AuthGuard('jwt') / Passport
        { provide: JwtAuthGuard, useClass: TestJwtAuthGuard },
        { provide: UploadDocumentUseCase, useValue: uploadDocumentUseCase },
        { provide: FindAllDocumentsUseCase, useValue: findAllDocumentsUseCase },
        { provide: DeleteDocumentUseCase, useValue: deleteDocumentUseCase },
        { provide: ReprocessOcrUseCase, useValue: reprocessOcrUseCase },
        { provide: UpdateDocumentUseCase, useValue: updateDocumentUseCase },
        { provide: CloudflareR2Service, useValue: r2Service },
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepository },
        { provide: QuotaService, useValue: quotaService },
        { provide: InMemoryQueueService, useValue: queueService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
    );
    await app.init();
    const server = (app as any).getHttpServer();
    const router = server._events?.request?._router;
    const routes =
      router?.stack
        ?.filter((r: any) => r.route)
        .map((r: any) => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`) ?? [];
    console.log('ROUTES:', JSON.stringify(routes, null, 2));
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    uploadDocumentUseCase.execute.mockResolvedValue(sampleDocument);
    findAllDocumentsUseCase.execute.mockResolvedValue([sampleDocument]);
    deleteDocumentUseCase.execute.mockResolvedValue(undefined);
    reprocessOcrUseCase.execute.mockResolvedValue({ ...sampleDocument, ocrStatus: 'processing' });
    updateDocumentUseCase.execute.mockResolvedValue({ ...sampleDocument, filename: 'renamed.pdf' });
    r2Service.downloadFile.mockResolvedValue(Buffer.from('fake-file-content'));
    documentRepository.findById.mockResolvedValue(sampleDocument);
    quotaService.getUserQuotaUsage.mockResolvedValue({
      storageUsed: 1024,
      maxStorage: 100 * 1024 * 1024,
      documentCount: 1,
      maxDocuments: 50,
    });
    quotaService.formatBytes.mockImplementation((b: number) => `${b} B`);
    quotaService.checkUserQuota.mockResolvedValue(undefined);
    queueService.getQueueStats.mockResolvedValue({ pending: 0, processing: 0, completed: 5 });
    queueService.getJobStatus.mockResolvedValue({ id: VALID_JOB_ID, status: 'completed' });
  });

  // ─── POST /documents/upload ──────────────────────────────────────────────────

  describe('POST /documents/upload', () => {
    it('should upload a PDF and return 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .attach('file', Buffer.from('%PDF-1.4 fake pdf'), {
          filename: 'test-document.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          filename: 'test-document.pdf',
          mimeType: 'application/pdf',
        }),
        expect.any(String),
      );
      expect(response.body).toHaveProperty('id');
    });

    it('should upload a JPEG and return 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .attach('file', Buffer.from('fake-jpeg-data'), {
          filename: 'invoice.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should upload with optional subscription_id', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .field('subscription_id', VALID_SUB_ID)
        .attach('file', Buffer.from('%PDF-1.4 fake'), {
          filename: 'sub-doc.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionId: VALID_SUB_ID }),
        expect.any(String),
      );
    });

    it('should upload with optional contract_id', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .field('contract_id', '42')
        .attach('file', Buffer.from('%PDF-1.4 fake'), {
          filename: 'contract.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(uploadDocumentUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ contractId: 42 }),
        expect.any(String),
      );
    });

    it('should reject file larger than 10MB with 400 or 413', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .attach('file', largeBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });

      expect([400, 413, 500]).toContain(response.status);
    });

    it('should reject unsupported file type with 400', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set(authHeader())
        .attach('file', Buffer.from('text'), { filename: 'doc.txt', contentType: 'text/plain' })
        .expect(400);
    });

    it('should reject request without file with 400', async () => {
      await request(app.getHttpServer()).post('/documents/upload').set(authHeader()).expect(400);
    });

    it('should reject request without authentication with 401', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', Buffer.from('%PDF-1.4'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
    });

    it('should reject request with invalid token with 401', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', 'Bearer bad-token')
        .attach('file', Buffer.from('%PDF-1.4'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
    });
  });

  // ─── GET /documents ──────────────────────────────────────────────────────────

  describe('GET /documents', () => {
    it('should return list of documents for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set(authHeader())
        .expect(200);

      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: TEST_USER_ID }),
      );
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('filename');
      expect(response.body[0]).toHaveProperty('mime_type');
      expect(response.body[0]).toHaveProperty('ocr_status');
      expect(response.body[0]).toHaveProperty('uploaded_at');
    });

    it('should filter documents by subscription_id', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .query({ subscription_id: VALID_SUB_ID })
        .set(authHeader())
        .expect(200);
      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionId: VALID_SUB_ID }),
      );
    });

    it('should filter documents by ocr_status', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .query({ ocr_status: 'completed' })
        .set(authHeader())
        .expect(200);
      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ ocrStatus: 'completed' }),
      );
    });

    it('should limit number of results', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .query({ limit: 5 })
        .set(authHeader())
        .expect(200);
      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5 }),
      );
    });

    it('should sort documents by uploaded_at desc', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .query({ sort: 'uploaded_at:desc' })
        .set(authHeader())
        .expect(200);
      expect(findAllDocumentsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'uploaded_at:desc' }),
      );
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/documents').expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', 'Bearer bad-token')
        .expect(401);
    });
  });

  // ─── GET /documents/:id ──────────────────────────────────────────────────────

  describe('GET /documents/:id', () => {
    it('should return document details for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .expect(200);

      expect(documentRepository.findById).toHaveBeenCalledWith(VALID_DOC_ID);
      expect(response.body.id).toBe(VALID_DOC_ID);
    });

    it('should return 404 for non-existent document', async () => {
      documentRepository.findById.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .expect(404);
    });

    it('should return 404 when accessing another user document', async () => {
      documentRepository.findById.mockResolvedValueOnce({
        ...sampleDocument,
        userId: 'other-user-id',
      });
      await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/documents/${VALID_DOC_ID}`).expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}`)
        .set('Authorization', 'Bearer bogus-token')
        .expect(401);
    });
  });

  // ─── PUT /documents/:id ──────────────────────────────────────────────────────

  describe('PUT /documents/:id', () => {
    it('should update document filename', async () => {
      const response = await request(app.getHttpServer())
        .put(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .send({ filename: 'renamed.pdf' })
        .expect(200);

      expect(updateDocumentUseCase.execute).toHaveBeenCalledWith(
        VALID_DOC_ID,
        TEST_USER_ID,
        expect.objectContaining({ filename: 'renamed.pdf' }),
      );
      expect(response.body).toHaveProperty('id');
    });

    it('should return 400 for empty filename', async () => {
      await request(app.getHttpServer())
        .put(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .send({ filename: '' })
        .expect(400);
    });

    it('should return 400 for filename exceeding 255 chars', async () => {
      await request(app.getHttpServer())
        .put(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .send({ filename: 'a'.repeat(256) + '.pdf' })
        .expect(400);
    });

    it('should return 404 when use case throws NotFoundException', async () => {
      updateDocumentUseCase.execute.mockRejectedValueOnce(
        new NotFoundException('Document not found'),
      );
      await request(app.getHttpServer())
        .put(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .send({ filename: 'renamed.pdf' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/documents/${VALID_DOC_ID}`)
        .send({ filename: 'renamed.pdf' })
        .expect(401);
    });
  });

  // ─── POST /documents/:id/reprocess-ocr ──────────────────────────────────────

  describe('POST /documents/:id/reprocess-ocr', () => {
    it('should trigger OCR reprocessing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/documents/${VALID_DOC_ID}/reprocess-ocr`)
        .set(authHeader())
        .send({ force: true })
        .expect(200);

      expect(reprocessOcrUseCase.execute).toHaveBeenCalledWith(
        VALID_DOC_ID,
        TEST_USER_ID,
        expect.objectContaining({ force: true }),
      );
      expect(response.body.ocr_status).toBe('processing');
    });

    it('should return 404 when document not found', async () => {
      reprocessOcrUseCase.execute.mockRejectedValueOnce(
        new NotFoundException('Document not found'),
      );
      await request(app.getHttpServer())
        .post(`/documents/${VALID_DOC_ID}/reprocess-ocr`)
        .set(authHeader())
        .send({})
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/documents/${VALID_DOC_ID}/reprocess-ocr`)
        .send({})
        .expect(401);
    });
  });

  // ─── GET /documents/:id/download ─────────────────────────────────────────────

  describe('GET /documents/:id/download', () => {
    it('should stream file for document owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}/download`)
        .set(authHeader())
        .expect(200);

      expect(documentRepository.findById).toHaveBeenCalledWith(VALID_DOC_ID);
      expect(r2Service.downloadFile).toHaveBeenCalledWith(sampleDocument.r2Key);
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 404 for non-existent document', async () => {
      documentRepository.findById.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}/download`)
        .set(authHeader())
        .expect(404);
    });

    it('should return 404 when accessing another user document', async () => {
      documentRepository.findById.mockResolvedValueOnce({
        ...sampleDocument,
        userId: 'other-user-id',
      });
      await request(app.getHttpServer())
        .get(`/documents/${VALID_DOC_ID}/download`)
        .set(authHeader())
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/documents/${VALID_DOC_ID}/download`).expect(401);
    });
  });

  // ─── DELETE /documents/:id ───────────────────────────────────────────────────

  describe('DELETE /documents/:id', () => {
    it('should delete document and return 204', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .expect(204);
      expect(deleteDocumentUseCase.execute).toHaveBeenCalledWith(VALID_DOC_ID, TEST_USER_ID);
    });

    it('should return 404 when document not found', async () => {
      deleteDocumentUseCase.execute.mockRejectedValueOnce(
        new NotFoundException('Document not found'),
      );
      await request(app.getHttpServer())
        .delete(`/documents/${VALID_DOC_ID}`)
        .set(authHeader())
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete(`/documents/${VALID_DOC_ID}`).expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .delete(`/documents/${VALID_DOC_ID}`)
        .set('Authorization', 'Bearer bad-token')
        .expect(401);
    });
  });

  // ─── GET /documents/quota ────────────────────────────────────────────────────

  describe('GET /documents/quota', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/documents/quota').expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/documents/quota')
        .set('Authorization', 'Bearer bad-token')
        .expect(401);
    });
  });

  // ─── GET /documents/queue/stats ──────────────────────────────────────────────

  describe('GET /documents/queue/stats', () => {
    it('should return queue statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents/queue/stats')
        .set(authHeader())
        .expect(200);

      expect(queueService.getQueueStats).toHaveBeenCalled();
      expect(response.body).toHaveProperty('pending');
      expect(response.body).toHaveProperty('processing');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/documents/queue/stats').expect(401);
    });
  });

  // ─── GET /documents/job/:jobId/status ────────────────────────────────────────

  describe('GET /documents/job/:jobId/status', () => {
    it('should return job status for valid jobId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/documents/job/${VALID_JOB_ID}/status`)
        .set(authHeader())
        .expect(200);

      expect(queueService.getJobStatus).toHaveBeenCalledWith(VALID_JOB_ID);
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent job', async () => {
      queueService.getJobStatus.mockRejectedValueOnce(new Error('Job not found'));
      await request(app.getHttpServer())
        .get('/documents/job/non-existent-job/status')
        .set(authHeader())
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/documents/job/${VALID_JOB_ID}/status`).expect(401);
    });
  });
});
