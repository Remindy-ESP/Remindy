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

  afterEach(async () => {
    if (app) await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', 'Bearer test-token')
      .expect(200)
      .expect('Hello World!');
  });

  it('/ (GET) returns 401 without authentication', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });
});