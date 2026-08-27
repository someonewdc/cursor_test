import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  findByPostId(postId: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(id: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id },
    });
  }

  async hasPost(postId: number): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    return post !== null;
  }

  create(postId: number, body: string): Promise<Comment> {
    return this.prisma.comment.create({
      data: { postId, body },
    });
  }

  async remove(id: number): Promise<Comment | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }
    return this.prisma.comment.delete({
      where: { id },
    });
  }
}
