import { Module, forwardRef } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { RealtimeModule } from '../../../notifications/realtime.module';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule { }
