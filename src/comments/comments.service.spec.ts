import { execSync } from 'node:child_process';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { CommentsService } from './comments.service';

process.env.DATABASE_URL = 'file:./comments-service.test.db';

describe('CommentsService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let commentsService: CommentsService;

  beforeAll(() => {
    execSync('pnpm exec prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [CommentsService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    commentsService = moduleRef.get(CommentsService);
    await moduleRef.init();
  });

  afterEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await moduleRef.close();
  });

  async function createPost() {
    return prisma.post.create({
      data: {
        title: 'A post',
        body: 'With comments',
      },
    });
  }

  it('create persists a comment', async () => {
    const post = await createPost();

    const created = await commentsService.create(post.id, 'First comment');

    const found = await prisma.comment.findUnique({
      where: { id: created.id },
    });

    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        postId: post.id,
        body: 'First comment',
      }),
    );
  });

  it('hasPost returns true only when the post exists', async () => {
    const post = await createPost();

    await expect(commentsService.hasPost(post.id)).resolves.toBe(true);
    await expect(commentsService.hasPost(99999)).resolves.toBe(false);
  });

  it('findByPostId returns comments ordered by createdAt ascending', async () => {
    const post = await createPost();
    const older = await prisma.comment.create({
      data: {
        postId: post.id,
        body: 'Older',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    });
    const newer = await prisma.comment.create({
      data: {
        postId: post.id,
        body: 'Newer',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
      },
    });

    const comments = await commentsService.findByPostId(post.id);

    expect(comments.map((comment) => comment.id)).toEqual([older.id, newer.id]);
  });

  it('findOne returns the comment by id', async () => {
    const post = await createPost();
    const created = await prisma.comment.create({
      data: {
        postId: post.id,
        body: 'Look me up',
      },
    });

    const found = await commentsService.findOne(created.id);

    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        body: 'Look me up',
      }),
    );
  });

  it('remove deletes the comment', async () => {
    const post = await createPost();
    const created = await prisma.comment.create({
      data: {
        postId: post.id,
        body: 'Gone soon',
      },
    });

    const removed = await commentsService.remove(created.id);

    expect(removed).toEqual(
      expect.objectContaining({
        id: created.id,
        body: 'Gone soon',
      }),
    );

    const found = await prisma.comment.findUnique({
      where: { id: created.id },
    });
    expect(found).toBeNull();
  });

  it('remove returns null when the comment does not exist', async () => {
    const removed = await commentsService.remove(99999);

    expect(removed).toBeNull();
  });
});
