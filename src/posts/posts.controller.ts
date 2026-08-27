import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Render,
} from '@nestjs/common';
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
