import { Module, forwardRef } from '@nestjs/common';
import { LikesController } from './likes/likes.controller';
import { LikesService } from './likes/likes.service';
import { FavoritesController } from './favorites/favorites.controller';
import { FavoritesService } from './favorites/favorites.service';
import { FollowsController } from './follows/follows.controller';
import { FollowsService } from './follows/follows.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule)],
    controllers: [LikesController, FavoritesController, FollowsController],
    providers: [LikesService, FavoritesService, FollowsService],
    exports: [LikesService, FavoritesService, FollowsService],
})
export class SocialModule { }
