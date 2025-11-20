import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from '../../core/common/guards/ws-jwt.guard';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        forwardRef(() => NotificationsModule),
    ],
    controllers: [ConversationsController],
    providers: [ConversationsService, ChatGateway, WsJwtGuard],
    exports: [ConversationsService, ChatGateway],
})
export class ConversationsModule { }
