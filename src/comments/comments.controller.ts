import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CommentsService } from './comments.service';

const parseIdPipe = new ParseIntPipe({
  exceptionFactory: () => new NotFoundException(),
});

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:id/comments')
  async create(
    @Param('id', parseIdPipe) postId: number,
    @Body('body') body: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const postExists = await this.commentsService.hasPost(postId);
    if (!postExists) {
      throw new NotFoundException();
    }

    const trimmedBody = (body ?? '').trim();
    if (!trimmedBody) {
      const comments = await this.commentsService.findByPostId(postId);
      res.status(HttpStatus.BAD_REQUEST).render('partials/comments', {
        comments,
        error: 'Comment cannot be empty',
      });
      return;
    }

    await this.commentsService.create(postId, trimmedBody);
    const comments = await this.commentsService.findByPostId(postId);
    res.status(HttpStatus.CREATED).render('partials/comments', { comments });
  }

  @Delete('comments/:id')
  async remove(
    @Param('id', parseIdPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const deleted = await this.commentsService.remove(id);
    if (!deleted) {
      throw new NotFoundException();
    }
    const comments = await this.commentsService.findByPostId(deleted.postId);
    res.status(HttpStatus.OK).render('partials/comments', { comments });
  }
}
