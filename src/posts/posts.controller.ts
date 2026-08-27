import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
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
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const trimmedTitle = (title ?? '').trim();
    const trimmedBody = (body ?? '').trim();

    if (!trimmedTitle || !trimmedBody) {
      const posts = await this.postsService.findAll();
      res.status(HttpStatus.BAD_REQUEST).render('posts/index', {
        posts,
        error: 'Title and body are required',
        title: title ?? '',
        body: body ?? '',
      });
      return;
    }

    const post = await this.postsService.create({
      title: trimmedTitle,
      body: trimmedBody,
    });
    const location = `/posts/${post.id}`;
    if (req.get('HX-Request') === 'true') {
      res.status(HttpStatus.CREATED).set('HX-Redirect', location).end();
      return;
    }
    res.redirect(HttpStatus.SEE_OTHER, location);
  }

  @Get('posts/:id/edit')
  @Render('posts/edit')
  async edit(@Param('id', parsePostIdPipe) id: number) {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException();
    }
    return {
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
      },
    };
  }

  @Put('posts/:id')
  async update(
    @Param('id', parsePostIdPipe) id: number,
    @Body('title') title: string | undefined,
    @Body('body') body: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const existing = await this.postsService.findOne(id);
    if (!existing) {
      throw new NotFoundException();
    }

    const trimmedTitle = (title ?? '').trim();
    const trimmedBody = (body ?? '').trim();

    if (!trimmedTitle || !trimmedBody) {
      res.status(HttpStatus.BAD_REQUEST).render('posts/edit', {
        post: {
          id,
          title: title ?? '',
          body: body ?? '',
        },
        error: 'Title and body are required',
      });
      return;
    }

    await this.postsService.update(id, {
      title: trimmedTitle,
      body: trimmedBody,
    });
    const location = `/posts/${id}`;
    if (req.get('HX-Request') === 'true') {
      res.status(HttpStatus.OK).set('HX-Redirect', location).end();
      return;
    }
    res.redirect(HttpStatus.SEE_OTHER, location);
  }

  @Delete('posts/:id')
  async remove(
    @Param('id', parsePostIdPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const deleted = await this.postsService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
    if (req.get('HX-Request') === 'true') {
      res.status(HttpStatus.OK).set('HX-Redirect', '/').end();
      return;
    }
    res.redirect(HttpStatus.SEE_OTHER, '/');
  }

  @Get('posts/:id')
  @Render('posts/show')
  async show(@Param('id', parsePostIdPipe) id: number) {
    const post = await this.postsService.findOneWithComments(id);
    if (!post) {
      throw new NotFoundException();
    }
    return {
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        createdAt: formatPostDate(post.createdAt),
        createdAtIso: post.createdAt.toISOString(),
      },
      comments: post.comments,
    };
  }
}
