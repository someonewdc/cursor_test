import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppController } from './app.controller';
import { configureApp } from './configure-app';

describe('AppController', () => {
  let app: NestExpressApplication;
  let appController: AppController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    appController = app.get(AppController);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('should return HTML containing Blog and htmx', async () => {
      const response = await request(app.getHttpServer()).get('/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('Blog');
      expect(response.text).toMatch(/htmx/i);
    });
  });

  describe('GET /health', () => {
    it('should return { ok: true }', () => {
      expect(appController.getHealth()).toEqual({ ok: true });
    });
  });
});
