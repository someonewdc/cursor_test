import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';

const parsePostIdPipe = new ParseIntPipe({
  exceptionFactory: () => new NotFoundException(),
});

export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Render('posts/index')
  async index() {
    const posts = await this.postsService.findAll();
    return { posts };
  }

  @Post('posts')
  async create(
    @Body('title') title: string | undefined,
    @Body('body') body: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const trimmedTitle = (title ?? '').trim();
    const trimmedBody = (body ?? '').trim();

    if (!trimmedTitle || !trimmedBody) {
      const posts = await this.postsService.findAll();
      res.status(HttpStatus.BAD_REQUEST).render('posts/index', {
        posts,
        error: 'Title and body are required',
      });
      return;
    }

    const post = await this.postsService.create({
      title: trimmedTitle,
      body: trimmedBody,
    });
    res
      .status(HttpStatus.CREATED)
      .set('HX-Redirect', `/posts/${post.id}`)
      .end();
  }

  @Get('posts/:id')
  @Render('posts/show')
  async show(@Param('id', parsePostIdPipe) id: number) {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException();
    }
    return {
      post: {
        title: post.title,
        body: post.body,
        createdAt: formatPostDate(post.createdAt),
        createdAtIso: post.createdAt.toISOString(),
      },
    };
  }
}
