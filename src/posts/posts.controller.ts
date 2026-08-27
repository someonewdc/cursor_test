import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Render('posts/index')
  async index() {
    const posts = await this.postsService.findAll();
    return { posts };
  }

  @Get('posts/:id')
  async show(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const post = await this.postsService.findOne(id);
    if (!post) {
      res.status(HttpStatus.NOT_FOUND).render('not-found');
      return;
    }
    res.render('posts/show', { post });
  }
}
