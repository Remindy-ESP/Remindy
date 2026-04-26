import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

// FIXME: skipped pending a proper rewrite — see audit.e2e-spec.ts for the
// canonical pattern (mock JwtTokenService, build a minimal TestingModule
// with use-case mocks instead of importing AppModule).
//
// Why this can't run today, even after the auth fixes in this PR:
//   1. authToken is the literal string 'mock-jwt-token', not a signed JWT,
//      so the global guard rejects every request with 401.
//   2. the suite imports AppModule, which boots the full DI tree including
//      TypeORM. The CI test:e2e step points at an empty Postgres service
//      (no migrations run before this step), so DocumentRepository queries
//      fail before the controller is even reached.
//   3. /documents/upload talks to CloudflareR2Service and the OCR pipeline,
//      but the e2e CI step injects neither R2_* nor GEMINI_API_KEY.
//
// Re-enable by porting to the audit.e2e-spec.ts shape: minimal module,
// mocked use-cases, JwtTokenService.verifyAccessToken returning a fake
// payload for known test tokens.
describe.skip('DocumentController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let documentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Mock authentication for tests
    // In a real scenario, you would call POST /auth/login
    authToken = 'mock-jwt-token';
  }, 30000); // Increase timeout to 30 seconds

  afterAll(async () => {
    // Cleanup: delete test documents
    if (dataSource && documentId) {
      try {
        await dataSource.query('DELETE FROM documents WHERE id = $1', [documentId]);
      } catch {
        // Ignore cleanup errors
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('POST /documents/upload', () => {
    it('should upload a PDF document successfully', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfBuffer, {
          filename: 'test-document.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('test-document.pdf');
      expect(response.body.mime_type).toBe('application/pdf');
      expect(response.body.ocr_status).toBe('processing');
      expect(response.body).toHaveProperty('r2_key');
      expect(response.body).toHaveProperty('file_hash');

      // Save document ID for later tests
      documentId = response.body.id;
    });

    it('should upload an image document successfully', async () => {
      const imageBuffer = Buffer.from('fake image content');

      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', imageBuffer, {
          filename: 'invoice.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('invoice.jpg');
      expect(response.body.mime_type).toBe('image/jpeg');
      expect(response.body.ocr_status).toBe('processing');
    });

    it('should upload with optional subscription_id', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf');
      const subscriptionId = 'sub-123-456';

      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('subscription_id', subscriptionId)
        .attach('file', pdfBuffer, {
          filename: 'subscription-doc.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.subscription_id).toBe(subscriptionId);
    });

    it('should upload with optional contract_id', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf');

      const response = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('contract_id', '42')
        .attach('file', pdfBuffer, {
          filename: 'contract-doc.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(response.body.contract_id).toBe(42);
    });

    it('should reject file larger than 10MB', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, {
          filename: 'large-file.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);
    });

    it('should reject unsupported file type', async () => {
      const buffer = Buffer.from('fake content');

      await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', buffer, {
          filename: 'document.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('should reject request without file', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should reject request without authentication', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf');

      await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', pdfBuffer, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(401);
    });
  });

  describe('GET /documents', () => {
    it('should return list of user documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const document = response.body[0];
      expect(document).toHaveProperty('id');
      expect(document).toHaveProperty('filename');
      expect(document).toHaveProperty('mime_type');
      expect(document).toHaveProperty('ocr_status');
      expect(document).toHaveProperty('uploaded_at');
    });

    it('should filter documents by subscription_id', async () => {
      const subscriptionId = 'sub-123-456';

      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ subscription_id: subscriptionId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        response.body.forEach((doc: any) => {
          expect(doc.subscription_id).toBe(subscriptionId);
        });
      }
    });

    it('should filter documents by ocr_status', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ ocr_status: 'completed' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        response.body.forEach((doc: any) => {
          expect(doc.ocr_status).toBe('completed');
        });
      }
    });

    it('should limit number of results', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should sort documents by uploaded_at desc', async () => {
      const response = await request(app.getHttpServer())
        .get('/documents')
        .query({ sort: 'uploaded_at:desc' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 1) {
        const first = new Date(response.body[0].uploaded_at);
        const second = new Date(response.body[1].uploaded_at);
        expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/documents').expect(401);
    });
  });

  describe('GET /documents/:id', () => {
    it('should return document details', async () => {
      if (!documentId) {
        // Skip if no document was created
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(documentId);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('file_size');
      expect(response.body).toHaveProperty('mime_type');
      expect(response.body).toHaveProperty('ocr_status');
      expect(response.body).toHaveProperty('r2_key');
      expect(response.body).toHaveProperty('file_hash');
      expect(response.body).toHaveProperty('uploaded_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/documents/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when accessing other user document', async () => {
      // In real scenario, you would create a document with another user
      // and try to access it
      const otherId = '11111111-1111-1111-1111-111111111111';

      await request(app.getHttpServer())
        .get(`/documents/${otherId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/documents/${documentId}`).expect(401);
    });
  });

  describe('PUT /documents/:id', () => {
    it('should update document filename', async () => {
      if (!documentId) {
        return;
      }

      const newFilename = 'renamed-document.pdf';

      const response = await request(app.getHttpServer())
        .put(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ filename: newFilename })
        .expect(200);

      expect(response.body.filename).toBe(newFilename);
    });

    it('should update document folder', async () => {
      if (!documentId) {
        return;
      }

      const folderId = 'folder-123-456';

      const response = await request(app.getHttpServer())
        .put(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ folder_id: folderId })
        .expect(200);

      expect(response.body.folder_id).toBe(folderId);
    });

    it('should reject empty filename', async () => {
      if (!documentId) {
        return;
      }

      await request(app.getHttpServer())
        .put(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ filename: '' })
        .expect(400);
    });

    it('should reject filename longer than 255 characters', async () => {
      if (!documentId) {
        return;
      }

      const longFilename = 'a'.repeat(256) + '.pdf';

      await request(app.getHttpServer())
        .put(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ filename: longFilename })
        .expect(400);
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .put(`/documents/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ filename: 'new-name.pdf' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/documents/${documentId}`)
        .send({ filename: 'new-name.pdf' })
        .expect(401);
    });
  });

  describe('POST /documents/:id/reprocess-ocr', () => {
    it('should reprocess OCR for a document', async () => {
      if (!documentId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .post(`/documents/${documentId}/reprocess-ocr`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: true })
        .expect(200);

      expect(response.body.id).toBe(documentId);
      expect(response.body.ocr_status).toMatch(/pending|processing/);
    });

    it('should require force flag for already completed OCR', async () => {
      if (!documentId) {
        return;
      }

      await request(app.getHttpServer())
        .post(`/documents/${documentId}/reprocess-ocr`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: false })
        .expect(400);
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/documents/${fakeId}/reprocess-ocr`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ force: true })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/documents/${documentId}/reprocess-ocr`)
        .send({ force: true })
        .expect(401);
    });
  });

  describe('GET /documents/:id/download', () => {
    it('should download document file', async () => {
      if (!documentId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/documents/${documentId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-type']).toMatch(/pdf|image/);
      expect(response.body).toBeDefined();
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/documents/${fakeId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate ownership before download', async () => {
      // Try to download another user's document
      const otherId = '11111111-1111-1111-1111-111111111111';

      await request(app.getHttpServer())
        .get(`/documents/${otherId}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/documents/${documentId}/download`).expect(401);
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document (soft delete)', async () => {
      if (!documentId) {
        return;
      }

      await request(app.getHttpServer())
        .delete(`/documents/${documentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify document is soft deleted (should not appear in list)
      const response = await request(app.getHttpServer())
        .get('/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedDoc = response.body.find((doc: any) => doc.id === documentId);
      expect(deletedDoc).toBeUndefined();
    });

    it('should return 404 for non-existent document', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/documents/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate ownership before deletion', async () => {
      const otherId = '11111111-1111-1111-1111-111111111111';

      await request(app.getHttpServer())
        .delete(`/documents/${otherId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      const someId = '22222222-2222-2222-2222-222222222222';

      await request(app.getHttpServer()).delete(`/documents/${someId}`).expect(401);
    });
  });

  describe('Rate limiting', () => {
    it('should apply throttle guard', async () => {
      // Make multiple rapid requests to test throttling
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/documents')
            .set('Authorization', `Bearer ${authToken}`),
        );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
