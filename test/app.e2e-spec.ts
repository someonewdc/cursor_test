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
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    post = await prisma.post.create({
      data: {
        title: 'My first post',
        body: 'Hello from SQLite',
      },
    });
  });

  afterEach(async () => {
    await prisma.comment.deleteMany();
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
        expect(res.text).toContain('name="htmx-config"');
        expect(res.text).toContain('"code":"400","swap":true');
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
        expect(res.text).toContain('hx-post="/posts"');
        expect(res.text).toContain('hx-target="body"');
        expect(res.text).toContain('action="/posts"');
        expect(res.text).toContain('method="post"');
      });
  });

  it('/posts (POST) creates a post and redirects with HX-Redirect', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .set('HX-Request', 'true')
      .type('form')
      .send({ title: '  New post  ', body: '  New body  ' })
      .expect(201);

    expect(res.headers['hx-redirect']).toMatch(/^\/posts\/\d+$/);

    const id = Number(res.headers['hx-redirect'].split('/').at(-1));
    const created = await prisma.post.findUnique({ where: { id } });

    expect(created).toEqual(
      expect.objectContaining({
        id,
        title: 'New post',
        body: 'New body',
      }),
    );
  });

  it('/posts (POST) redirects to the new post without HTMX', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts')
      .type('form')
      .send({ title: 'Plain post', body: 'No HTMX' })
      .expect(303);

    expect(res.headers.location).toMatch(/^\/posts\/\d+$/);

    const id = Number(res.headers.location.split('/').at(-1));
    const created = await prisma.post.findUnique({ where: { id } });

    expect(created).toEqual(
      expect.objectContaining({
        id,
        title: 'Plain post',
        body: 'No HTMX',
      }),
    );
  });

  it('/posts (POST) returns 400 when title or body is empty', async () => {
    return request(app.getHttpServer())
      .post('/posts')
      .type('form')
      .send({ title: 'Kept title', body: '  ' })
      .expect('Content-Type', /html/)
      .expect(400)
      .expect((res) => {
        expect(res.text).toContain('Title and body are required');
        expect(res.text).toContain('My first post');
        expect(res.text).toContain(`/posts/${post.id}`);
        expect(res.text).toContain('value="Kept title"');
        expect(res.text).toContain('hx-target="body"');
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
        expect(res.text).toContain(`/posts/${post.id}/edit`);
        expect(res.text).toContain('Edit');
        expect(res.text).toContain(`hx-delete="/posts/${post.id}"`);
        expect(res.text).toContain('hx-confirm="Delete this post?"');
        expect(res.text).toContain('Delete');
        expect(res.text).toContain(
          `datetime="${post.createdAt.toISOString()}"`,
        );
        expect(res.text).not.toMatch(/datetime="[A-Z][a-z]{2} /);
        expect(res.text).toContain('id="comments"');
        expect(res.text).toContain('No comments yet');
        expect(res.text).toContain(`hx-post="/posts/${post.id}/comments"`);
        expect(res.text).toContain('hx-target="#comments"');
        expect(res.text).toContain('hx-swap="innerHTML"');
        expect(res.text).toContain('name="body"');
      });
  });

  it('/posts/:id/edit (GET) renders the edit form', () => {
    return request(app.getHttpServer())
      .get(`/posts/${post.id}/edit`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((res) => {
        expect(res.text).toContain(`hx-put="/posts/${post.id}"`);
        expect(res.text).toContain('value="My first post"');
        expect(res.text).toContain('Hello from SQLite');
      });
  });

  it('/posts/:id (PUT) updates a post then show contains the new title', async () => {
    const res = await request(app.getHttpServer())
      .put(`/posts/${post.id}`)
      .set('HX-Request', 'true')
      .type('form')
      .send({ title: 'Updated title', body: 'Updated body' })
      .expect(200);

    expect(res.headers['hx-redirect']).toBe(`/posts/${post.id}`);

    await request(app.getHttpServer())
      .get(`/posts/${post.id}`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((show) => {
        expect(show.text).toContain('Updated title');
        expect(show.text).toContain('Updated body');
      });
  });

  it('/posts/:id (PUT) returns 400 when title or body is empty', async () => {
    await request(app.getHttpServer())
      .put(`/posts/${post.id}`)
      .type('form')
      .send({ title: '  ', body: 'Still here' })
      .expect('Content-Type', /html/)
      .expect(400)
      .expect((res) => {
        expect(res.text).toContain('Title and body are required');
        expect(res.text).toContain('>Still here</textarea>');
      });

    const unchanged = await prisma.post.findUnique({ where: { id: post.id } });
    expect(unchanged).toEqual(
      expect.objectContaining({
        id: post.id,
        title: 'My first post',
        body: 'Hello from SQLite',
      }),
    );
  });

  it.each(['/posts/99999', '/posts/abc', '/posts/new', '/posts/99999/edit'])(
    '%s (GET) returns 404 HTML',
    (path) => {
      return request(app.getHttpServer())
        .get(path)
        .expect('Content-Type', /html/)
        .expect(404)
        .expect((res) => {
          expect(res.text).toContain('<!DOCTYPE html>');
          expect(res.text).toContain('Not found');
          expect(res.body).toEqual({});
        });
    },
  );

  it('/posts/:id (PUT) returns 404 HTML for an unknown id', () => {
    return request(app.getHttpServer())
      .put('/posts/99999')
      .type('form')
      .send({ title: 'Missing', body: 'Post' })
      .expect('Content-Type', /html/)
      .expect(404)
      .expect((res) => {
        expect(res.text).toContain('<!DOCTYPE html>');
        expect(res.text).toContain('Not found');
        expect(res.body).toEqual({});
      });
  });

  it('/posts/:id (DELETE) removes the post then a second DELETE returns 404', async () => {
    await prisma.comment.create({
      data: {
        postId: post.id,
        body: 'Cascade me',
      },
    });

    const res = await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .set('HX-Request', 'true')
      .expect(200);

    expect(res.headers['hx-redirect']).toBe('/');

    const gone = await prisma.post.findUnique({ where: { id: post.id } });
    expect(gone).toBeNull();

    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
    });
    expect(comments).toEqual([]);

    await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .set('HX-Request', 'true')
      .expect('Content-Type', /html/)
      .expect(404)
      .expect((second) => {
        expect(second.text).toContain('<!DOCTYPE html>');
        expect(second.text).toContain('Not found');
        expect(second.body).toEqual({});
      });
  });

  it('/posts/:id/comments (POST) then DELETE /comments/:id updates the show page', async () => {
    const created = await request(app.getHttpServer())
      .post(`/posts/${post.id}/comments`)
      .set('HX-Request', 'true')
      .type('form')
      .send({ body: '  A thoughtful note  ' })
      .expect('Content-Type', /html/)
      .expect(201);

    expect(created.text).toContain('A thoughtful note');
    expect(created.text).not.toContain('No comments yet');
    expect(created.text).not.toContain('<!DOCTYPE html>');
    expect(created.text).toContain('hx-target="#comments"');
    expect(created.text).toContain('hx-swap="innerHTML"');
    expect(created.text).toContain('hx-confirm="Delete this comment?"');

    const comment = await prisma.comment.findFirst({
      where: { postId: post.id },
    });
    expect(comment).toEqual(
      expect.objectContaining({
        postId: post.id,
        body: 'A thoughtful note',
      }),
    );
    expect(comment).not.toBeNull();
    const commentId = comment.id;
    expect(created.text).toContain(`hx-delete="/comments/${commentId}"`);

    await request(app.getHttpServer())
      .get(`/posts/${post.id}`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((show) => {
        expect(show.text).toContain('A thoughtful note');
        expect(show.text).toContain(`hx-delete="/comments/${commentId}"`);
      });

    const deleted = await request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('HX-Request', 'true')
      .expect('Content-Type', /html/)
      .expect(200);

    expect(deleted.text).toContain('No comments yet');
    expect(deleted.text).not.toContain('A thoughtful note');
    expect(deleted.text).not.toContain('<!DOCTYPE html>');

    await request(app.getHttpServer())
      .get(`/posts/${post.id}`)
      .expect('Content-Type', /html/)
      .expect(200)
      .expect((show) => {
        expect(show.text).toContain('No comments yet');
        expect(show.text).not.toContain('A thoughtful note');
      });
  });

  it('/posts/:id/comments (POST) returns 400 when the body is empty', async () => {
    return request(app.getHttpServer())
      .post(`/posts/${post.id}/comments`)
      .type('form')
      .send({ body: '  ' })
      .expect('Content-Type', /html/)
      .expect(400)
      .expect((res) => {
        expect(res.text).toContain('Comment cannot be empty');
        expect(res.text).toContain('No comments yet');
      });
  });

  it('/posts/:id/comments (POST) returns 404 HTML for an unknown post', () => {
    return request(app.getHttpServer())
      .post('/posts/99999/comments')
      .type('form')
      .send({ body: 'Orphan comment' })
      .expect('Content-Type', /html/)
      .expect(404)
      .expect((res) => {
        expect(res.text).toContain('<!DOCTYPE html>');
        expect(res.text).toContain('Not found');
        expect(res.body).toEqual({});
      });
  });

  it('/comments/:id (DELETE) returns 404 HTML for an unknown comment', () => {
    return request(app.getHttpServer())
      .delete('/comments/99999')
      .set('HX-Request', 'true')
      .expect('Content-Type', /html/)
      .expect(404)
      .expect((res) => {
        expect(res.text).toContain('<!DOCTYPE html>');
        expect(res.text).toContain('Not found');
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
