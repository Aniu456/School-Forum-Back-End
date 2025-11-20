import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEmitterService } from './notification-emitter.service';
import { RealtimeService } from './realtime.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationEmitterService,
    RealtimeService,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
    NotificationEmitterService,
    RealtimeService,
  ],
})
export class NotificationsModule { }
