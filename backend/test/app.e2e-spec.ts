import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from '../src/app.controller';

describe('Application Bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('AppController should be defined', () => {
    expect(app).toBeDefined();
  });

  it('GET / returns 404 (no route defined on AppController)', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });
});
