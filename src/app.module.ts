import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { FollowsModule } from './follows/follows.module';
import { FavoritesModule } from './favorites/favorites.module';
import { DraftsModule } from './drafts/drafts.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 数据库模块
    PrismaModule,
    // 认证模块
    AuthModule,
    // 用户模块
    UsersModule,
    // 帖子模块
    PostsModule,
    // 评论模块
    CommentsModule,
    // 点赞模块
    LikesModule,
    // 搜索模块
    SearchModule,
    // 通知模块
    NotificationsModule,
    // 管理模块
    AdminModule,
    // 关注模块
    FollowsModule,
    // 收藏模块
    FavoritesModule,
    // 草稿模块
    DraftsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
