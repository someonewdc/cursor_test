import { Injectable } from '@nestjs/common';
import { Comment, Post } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type PostWithComments = Post & { comments: Comment[] };

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Post[]> {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number): Promise<PostWithComments | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  create(data: { title: string; body: string }): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async update(
    id: number,
    data: { title: string; body: string },
  ): Promise<Post | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }
    return this.prisma.post.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Post | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
