import { Module, forwardRef } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule)],
    controllers: [AnnouncementsController],
    providers: [AnnouncementsService],
    exports: [AnnouncementsService],
})
export class AnnouncementsModule { }
