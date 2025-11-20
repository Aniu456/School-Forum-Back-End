import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    providers: [RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule { }
