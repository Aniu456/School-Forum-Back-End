import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseFilters, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // 存储用户ID和Socket ID的映射关系
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket 服务器初始化完成');
  }

  /**
   * 客户端连接时触发
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // 验证 JWT token
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      // 将 Socket 保存到映射中
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // 将客户端加入用户特定的房间
      client.join(`user:${userId}`);
      client.join(`user:${userId}:notifications`);

      this.logger.log(`用户 ${userId} 已连接，Socket ID: ${client.id}`);
    } catch (error) {
      this.logger.error(`连接验证失败: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接时触发
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // 从映射中移除断开连接的 Socket
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`用户 ${userId} 已断开连接，Socket ID: ${client.id}`);
        break;
      }
    }
  }

  /**
   * 获取未读通知数量
   */
  @SubscribeMessage('notification:unread_count')
  async handleGetUnreadCount(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      const unreadData = await this.notificationsService.getUnreadCount(userId);
      client.emit('notification:unread_count', unreadData);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 标记单个通知为已读
   */
  @SubscribeMessage('notification:mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      const result = await this.notificationsService.markAsRead(
        data.notificationId,
        userId,
      );

      client.emit('notification:read_success', {
        notificationId: result.id,
        isRead: result.isRead,
      });

      // 广播未读数量变化
      this.broadcastUnreadCount(userId);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 批量标记所有通知为已读
   */
  @SubscribeMessage('notification:mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

      const result = await this.notificationsService.markAllAsRead(userId);

      client.emit('notification:all_read_success', result);

      // 广播未读数量变化
      this.broadcastUnreadCount(userId);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 推送通知给用户
   * 这个方法由其他服务调用
   */
  notifyUser(userId: string, notification: any) {
    const userRoom = `user:${userId}:notifications`;
    this.server.to(userRoom).emit('notification:new', notification);

    this.logger.log(`通知已推送给用户 ${userId}`);
  }

  /**
   * 广播未读通知数量给用户
   */
  private async broadcastUnreadCount(userId: string) {
    const unreadData = await this.notificationsService.getUnreadCount(userId);
    const userRoom = `user:${userId}:notifications`;
    this.server.to(userRoom).emit('notification:unread_count_updated', unreadData);
  }

  /**
   * 获取用户在线状态
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * 广播在线用户数量（用于实时统计）
   */
  broadcastOnlineCount() {
    this.server.emit('system:online_count', {
      onlineUsers: this.getOnlineUsersCount(),
      timestamp: new Date().toISOString(),
    });
  }
}
