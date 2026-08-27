import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Post } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';

process.env.DATABASE_URL ??= 'file:./test.db';

describe('App (e2e)', () => {
  let app: NestExpressApplication<App>;
  let prisma: PrismaService;
  let post: Post;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication<App>>();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.post.deleteMany();
    post = await prisma.post.create({
      data: {
        title: 'My first post',
        body: 'Hello from SQLite',
      },
    });
  });

  afterEach(async () => {
    await prisma.post.deleteMany();
    await app.close();
  });

  it('/ (GET) contains the post title', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('Blog');
        expect(res.text).toMatch(/htmx/i);
        expect(res.text).toContain('My first post');
        expect(res.text).toContain(`/posts/${post.id}`);
      });
  });

  it('/ (GET) shows empty state when there are no posts', async () => {
    await prisma.post.deleteMany();

    return request(app.getHttpServer())
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('No posts yet');
      });
  });

  it('/posts/:id (GET) contains the post body', () => {
    return request(app.getHttpServer())
      .get(`/posts/${post.id}`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain('My first post');
        expect(res.text).toContain('Hello from SQLite');
      });
  });

  it('/posts/99999 (GET) returns 404 HTML', () => {
    return request(app.getHttpServer())
      .get('/posts/99999')
      .expect('Content-Type', /html/)
      .expect(404)
      .expect((res) => {
        expect(res.text).toContain('<!DOCTYPE html>');
        expect(res.body).toEqual({});
      });
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: true });
  });
});
