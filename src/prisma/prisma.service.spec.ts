import { execSync } from 'node:child_process';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaModule } from './prisma.module';

process.env.DATABASE_URL = 'file:./test.db';

describe('PrismaService', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  beforeAll(() => {
    execSync('pnpm exec prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await moduleRef.init();
  });

  afterEach(async () => {
    await prisma.post.deleteMany();
    await moduleRef.close();
  });

  it('can create a post and find it', async () => {
    const created = await prisma.post.create({
      data: {
        title: 'Feature 1',
        body: 'Prisma persistence',
      },
    });

    const found = await prisma.post.findUnique({
      where: { id: created.id },
    });

    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'Feature 1',
        body: 'Prisma persistence',
      }),
    );
  });
});
