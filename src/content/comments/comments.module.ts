import { Module, forwardRef } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { PostsModule } from '../posts/posts.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PointsModule } from '../../users/points.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PostsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => PointsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule { }
