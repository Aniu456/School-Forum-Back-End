import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AnnouncementsModule } from './content/announcements/announcements.module';
import { CommentsModule } from './content/comments/comments.module';
import { PostsModule } from './content/posts/posts.module';
import { CommonModule } from './core/common/common.module';
import { JwtAuthGuard } from './core/common/guards/jwt-auth.guard';
import { RolesGuard } from './core/common/guards/roles.guard';
import { LoggerMiddleware } from './core/common/middleware/logger.middleware';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { ActivitiesModule } from './features/activities/activities.module';
import { ConversationsModule } from './features/chat/conversations.module';
import { MarketplaceModule } from './features/marketplace/marketplace.module';
import { RecommendationsModule } from './features/recommendations/recommendations.module';
import { SearchModule } from './features/search/search.module';
import { SocialModule } from './features/social/social.module';
import { UploadModule } from './features/upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // ============================================
    // 核心模块
    // ============================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    PrismaModule,
    RedisModule,

    // ============================================
    // 业务模块
    // ============================================
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    SearchModule,
    NotificationsModule,
    AdminModule,
    RecommendationsModule,
    AnnouncementsModule,
    MarketplaceModule,
    SocialModule,
    ConversationsModule,
    ActivitiesModule,
    UploadModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
