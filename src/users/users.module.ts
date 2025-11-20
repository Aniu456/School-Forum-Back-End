import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersActivityService } from './users-activity.service';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [forwardRef(() => LikesModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersActivityService],
  exports: [UsersService, UsersActivityService],
})
export class UsersModule { }
