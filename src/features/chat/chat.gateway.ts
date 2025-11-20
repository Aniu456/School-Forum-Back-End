import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../core/common/guards/ws-jwt.guard';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        credentials: true,
    },
    namespace: '/chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

    constructor(private readonly conversationsService: ConversationsService) { }

    /**
     * 处理客户端连接
     */
    async handleConnection(client: Socket) {
        try {
            const userId = client.data.userId;
            if (!userId) {
                this.logger.warn(`Connection rejected: No userId in socket data`);
                client.disconnect();
                return;
            }

            // 记录用户socket
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            // 让用户加入自己的房间
            client.join(`user:${userId}`);

            this.logger.log(`User ${userId} connected (socket: ${client.id})`);

            // 发送未读消息数
            const unreadCount = await this.conversationsService.getUnreadCount(userId);
            client.emit('chat:unread_count', unreadCount);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    /**
     * 处理客户端断开连接
     */
    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId && this.userSockets.has(userId)) {
            this.userSockets.get(userId)!.delete(client.id);
            if (this.userSockets.get(userId)!.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }

    /**
     * 监听：发送消息
     * 客户端发送：chat:send_message
     */
    @SubscribeMessage('chat:send_message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string; content: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId, content } = data;

            // 验证并发送消息
            const sendDto: SendMessageDto = { content };
            const message = await this.conversationsService.sendMessage(
                conversationId,
                userId,
                sendDto,
            );

            // 获取会话详情（找到对方用户）
            const conversation = await this.conversationsService.getConversation(
                conversationId,
                userId,
            );

            // 向发送者确认消息已发送
            client.emit('chat:message_sent', {
                conversationId,
                message,
            });

            // 向对方用户推送新消息
            if (conversation.otherUser) {
                this.server.to(`user:${conversation.otherUser.id}`).emit('chat:message_created', {
                    conversationId,
                    message,
                    sender: message.sender,
                });

                // 更新对方的未读数
                this.updateUnreadCount(conversation.otherUser.id);
            }

            this.logger.log(
                `Message sent: ${message.id} in conversation ${conversationId}`,
            );

            return { success: true, message };
        } catch (error) {
            this.logger.error(`Send message error: ${error.message}`);
            client.emit('chat:error', {
                message: error.message || '发送消息失败',
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * 监听：标记消息已读
     * 客户端发送：chat:mark_read
     */
    @SubscribeMessage('chat:mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId } = data;

            // 更新 lastReadAt
            await this.conversationsService['prisma'].conversationParticipant.updateMany({
                where: {
                    conversationId,
                    userId,
                },
                data: {
                    lastReadAt: new Date(),
                },
            });

            // 更新未读数
            const unreadCount = await this.conversationsService.getUnreadCount(userId);
            client.emit('chat:unread_count', unreadCount);

            this.logger.log(`User ${userId} marked conversation ${conversationId} as read`);

            return { success: true };
        } catch (error) {
            this.logger.error(`Mark read error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 监听：正在输入
     * 客户端发送：chat:typing
     */
    @SubscribeMessage('chat:typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = client.data.userId;
            const { conversationId } = data;

            // 获取会话详情
            const conversation = await this.conversationsService.getConversation(
                conversationId,
                userId,
            );

            // 向对方用户推送"正在输入"状态
            if (conversation.otherUser) {
                this.server.to(`user:${conversation.otherUser.id}`).emit('chat:user_typing', {
                    conversationId,
                    userId,
                });
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Typing error: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * 更新用户的未读消息数
     */
    private async updateUnreadCount(userId: string) {
        try {
            const unreadCount = await this.conversationsService.getUnreadCount(userId);
            this.server.to(`user:${userId}`).emit('chat:unread_count', unreadCount);
        } catch (error) {
            this.logger.error(`Update unread count error: ${error.message}`);
        }
    }

    /**
     * 向特定用户发送消息（可供其他模块调用）
     */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}
