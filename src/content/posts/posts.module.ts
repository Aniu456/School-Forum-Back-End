import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PointsModule } from '../../users/points.module';
import { CommentsModule } from '../comments/comments.module';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ServiceCenterController } from './service-center.controller';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CommentsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => PointsModule),
  ],
  // ⚠️ 重要：具体路由的控制器必须在动态路由控制器之前
  // DraftsController (/posts/drafts) 和 ServiceCenterController (/posts/service-center)
  // 必须在 PostsController (/posts/:id) 之前，否则会被 :id 路由拦截
  controllers: [DraftsController, ServiceCenterController, PostsController],
  providers: [PostsService, DraftsService],
  exports: [PostsService, DraftsService],
})
export class PostsModule {}
