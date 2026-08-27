import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppController } from './app.controller';
import { configureApp } from './configure-app';

describe('AppController', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return JSON { ok: true }', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toEqual({ ok: true });
    });
  });
});
