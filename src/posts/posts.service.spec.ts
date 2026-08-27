import { execSync } from 'node:child_process';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from './posts.service';

process.env.DATABASE_URL = 'file:./posts-service.test.db';

describe('PostsService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let postsService: PostsService;

  beforeAll(() => {
    execSync('pnpm exec prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [PostsService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    postsService = moduleRef.get(PostsService);
    await moduleRef.init();
  });

  afterEach(async () => {
    await prisma.post.deleteMany();
    await moduleRef.close();
  });

  it('findAll returns posts ordered by createdAt descending', async () => {
    const older = await prisma.post.create({
      data: {
        title: 'Older',
        body: 'First',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    });
    const newer = await prisma.post.create({
      data: {
        title: 'Newer',
        body: 'Second',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    });

    const posts = await postsService.findAll();

    expect(posts.map((post) => post.id)).toEqual([newer.id, older.id]);
  });

  it('findOne returns the post by id', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Hello',
        body: 'World',
      },
    });

    const found = await postsService.findOne(created.id);

    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'Hello',
        body: 'World',
      }),
    );
  });

  it('findOne returns null when the post does not exist', async () => {
    const found = await postsService.findOne(99999);

    expect(found).toBeNull();
  });

  it('create persists a post', async () => {
    const created = await postsService.create({
      title: 'Created',
      body: 'From the service',
    });

    const found = await prisma.post.findUnique({ where: { id: created.id } });

    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'Created',
        body: 'From the service',
      }),
    );
  });

  it('update changes title and body', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Before',
        body: 'Old body',
      },
    });

    const updated = await postsService.update(created.id, {
      title: 'After',
      body: 'New body',
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'After',
        body: 'New body',
      }),
    );

    const found = await prisma.post.findUnique({ where: { id: created.id } });
    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'After',
        body: 'New body',
      }),
    );
  });

  it('update returns null when the post does not exist', async () => {
    const updated = await postsService.update(99999, {
      title: 'Nope',
      body: 'Missing',
    });

    expect(updated).toBeNull();
  });

  it('remove deletes the post', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'To delete',
        body: 'Gone soon',
      },
    });

    const removed = await postsService.remove(created.id);

    expect(removed).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'To delete',
        body: 'Gone soon',
      }),
    );

    const found = await prisma.post.findUnique({ where: { id: created.id } });
    expect(found).toBeNull();
  });

  it('remove returns null when the post does not exist', async () => {
    const removed = await postsService.remove(99999);

    expect(removed).toBeNull();
  });
});
