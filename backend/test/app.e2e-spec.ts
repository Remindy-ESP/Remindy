import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Controller } from '@nestjs/common';

@Controller()
class MinimalController {}

describe('Application Bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MinimalController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should bootstrap and have a defined app instance', () => {
    expect(app).toBeDefined();
  });

  it('should return 404 for unknown routes', async () => {
    await request(app.getHttpServer()).get('/this-route-does-not-exist').expect(404);
  });

  it('should return 404 for unknown POST routes', async () => {
    await request(app.getHttpServer()).post('/no-such-endpoint').expect(404);
  });
});
