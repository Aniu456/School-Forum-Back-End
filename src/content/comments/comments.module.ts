import { Module, forwardRef } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PostsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule { }
