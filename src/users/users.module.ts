import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersActivityService } from './users-activity.service';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { SocialModule } from '../features/social/social.module';

@Module({
  imports: [forwardRef(() => SocialModule)],
  controllers: [UsersController, PointsController],
  providers: [UsersService, UsersActivityService, PointsService],
  exports: [UsersService, UsersActivityService, PointsService],
})
export class UsersModule { }
