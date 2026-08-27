import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { CommentsModule } from './comments/comments.module';
import { HtmlNotFoundFilter } from './html-not-found.filter';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, PostsModule, CommentsModule],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HtmlNotFoundFilter,
    },
  ],
})
export class AppModule {}
