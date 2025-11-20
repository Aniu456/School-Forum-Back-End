import { Module, forwardRef } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { ServiceCenterController } from './service-center.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { CommentsModule } from '../comments/comments.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PointsModule } from '../../users/points.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CommentsModule), forwardRef(() => NotificationsModule), forwardRef(() => PointsModule)],
  controllers: [PostsController, DraftsController, ServiceCenterController],
  providers: [PostsService, DraftsService],
  exports: [PostsService, DraftsService],
})
export class PostsModule { }
