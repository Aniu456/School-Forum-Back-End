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
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
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

  private getAuthToken(client: Socket): string | undefined {
    const auth = (client.handshake as unknown as { auth?: unknown }).auth;
    if (auth && typeof auth === 'object') {
      const tokenProp = (auth as { token?: unknown }).token;
      if (typeof tokenProp === 'string') {
        return tokenProp;
      }
    }
    return undefined;
  }

  private hasSetMaxListeners(
    obj: unknown,
  ): obj is { setMaxListeners: (n: number) => void } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'setMaxListeners' in obj &&
      typeof (obj as { setMaxListeners: unknown }).setMaxListeners ===
        'function'
    );
  }

  private hasRemoveAllListeners(
    obj: unknown,
  ): obj is { removeAllListeners: () => void } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'removeAllListeners' in obj &&
      typeof (obj as { removeAllListeners: unknown }).removeAllListeners ===
        'function'
    );
  }

  afterInit(server: Server) {
    server.setMaxListeners(0);

    const engine = (server as unknown as { engine?: unknown }).engine;
    if (engine && this.hasSetMaxListeners(engine)) {
      engine.setMaxListeners(0);
      const ws = (engine as unknown as { ws?: unknown }).ws;
      if (ws && this.hasSetMaxListeners(ws)) {
        ws.setMaxListeners(0);
      }
    }

    const eio = (server as unknown as { eio?: unknown }).eio;
    if (eio && this.hasSetMaxListeners(eio)) {
      eio.setMaxListeners(0);
    }

    this.logger.log('WebSocket 服务器初始化完成，已配置内存泄漏防护');
  }

  /**
   * 客户端连接时触发
   */
  handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = this.getAuthToken(client);
      if (!token) {
        client.disconnect();
        return;
      }

      type JwtPayload = { sub: string };
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.sub;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      void client.join(`user:${userId}`);
      void client.join(`user:${userId}:notifications`);

      this.logger.log(`用户 ${userId} 已连接，Socket ID: ${client.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`连接验证失败: ${message}`);
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接时触发
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      let foundUser = false;

      // 从映射中移除断开连接的 Socket
      for (const [userId, sockets] of this.userSockets.entries()) {
        if (sockets.has(client.id)) {
          sockets.delete(client.id);

          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }

          this.logger.log(
            `用户 ${userId} 已断开连接，Socket ID: ${client.id}，剩余连接数: ${sockets.size}`,
          );
          foundUser = true;
          break;
        }
      }

      // 如果没有找到用户，直接记录日志
      if (!foundUser) {
        this.logger.warn(`Socket ${client.id} 断开连接，但未找到对应用户`);
      }

      // 确保 Socket 对象被正确清理
      // 移除所有事件监听器
      client.removeAllListeners();

      // 标记 Socket 为已清理
      (client as unknown as { cleaned?: boolean }).cleaned = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`处理断开连接时出错: ${message}`);
    }
  }

  /**
   * 获取未读通知数量
   */
  @SubscribeMessage('notification:unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    try {
      const token = this.getAuthToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      type JwtPayload = { sub: string };
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.sub;

      const unreadData = await this.notificationsService.getUnreadCount(userId);
      client.emit('notification:unread_count', unreadData);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      client.emit('error', { message });
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
      const token = this.getAuthToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      type JwtPayload = { sub: string };
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.sub;

      const result = await this.notificationsService.markAsRead(
        data.notificationId,
        userId,
      );

      client.emit('notification:read_success', {
        notificationId: result.id,
        isRead: result.isRead,
      });

      await this.broadcastUnreadCount(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      client.emit('error', { message });
    }
  }

  /**
   * 批量标记所有通知为已读
   */
  @SubscribeMessage('notification:mark_all_read')
  async handleMarkAllRead(@ConnectedSocket() client: Socket) {
    try {
      const token = this.getAuthToken(client);
      if (!token) {
        client.disconnect();
        return;
      }
      type JwtPayload = { sub: string };
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const userId = decoded.sub;

      const result = await this.notificationsService.markAllAsRead(userId);

      client.emit('notification:all_read_success', result);

      await this.broadcastUnreadCount(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      client.emit('error', { message });
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
    this.server
      .to(userRoom)
      .emit('notification:unread_count_updated', unreadData);
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

  /**
   * 模块销毁时清理资源
   */
  onModuleDestroy() {
    try {
      this.logger.log('清理 WebSocket 资源...');

      // 清理所有用户的 Socket 连接信息
      this.userSockets.clear();

      // 断开所有客户端连接
      if (this.server) {
        this.server.disconnectSockets();
        this.server.removeAllListeners();

        // 清理引擎和事件发射器
        const engine = (this.server as unknown as { engine?: unknown }).engine;
        if (engine && this.hasRemoveAllListeners(engine)) {
          engine.removeAllListeners();
        }

        const eio = (this.server as unknown as { eio?: unknown }).eio;
        if (eio && this.hasRemoveAllListeners(eio)) {
          eio.removeAllListeners();
        }
      }

      this.logger.log('WebSocket 资源清理完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`清理资源时出错: ${message}`);
    }
  }
}
