import { Module, forwardRef } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { NotificationsModule } from '../../../notifications/notifications.module';
import { PointsModule } from '../../../users/points.module';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule), forwardRef(() => PointsModule)],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule { }
