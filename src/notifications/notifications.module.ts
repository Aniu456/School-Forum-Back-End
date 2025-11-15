import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEmitterService } from './notification-emitter.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationsController],
  // ⭐️ NotificationEmitterService 中已经使用 forwardRef 处理循环依赖
  // 所以这里直接提供即可，NestJS 会自动处理
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationEmitterService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationEmitterService,
  ],
})
export class NotificationsModule {}
