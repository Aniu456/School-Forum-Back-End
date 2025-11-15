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

  /**
   * 验证 JWT Token 并获取用户 ID
   * @throws Error 如果 token 无效或过期
   */
  private verifyAndGetUserId(token: string): string {
    type JwtPayload = { sub: string };
    const decoded = this.jwtService.verify<JwtPayload>(token);
    return decoded.sub;
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

    // ⭐️ 启动心跳监控
    this.startHeartbeatMonitor();

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

      const userId = this.verifyAndGetUserId(token);

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

      // ⭐️ 多层级清理 Socket 的所有监听器和引用
      this.cleanupSocketListeners(client);

      // 标记 Socket 为已清理
      (client as unknown as { cleaned?: boolean }).cleaned = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`处理断开连接时出错: ${message}`);
    }
  }

  /**
   * 彻底清理 Socket 的所有监听器和引用
   * 解决 MaxListenersExceededWarning 问题的关键步骤
   */
  private cleanupSocketListeners(socket: Socket): void {
    try {
      // 1. 清理 Socket 本身的所有监听器
      socket.removeAllListeners();

      // 2. 清理 Socket 的 handshake 数据
      (socket as unknown as { handshake?: unknown }).handshake = undefined;

      // 3. 清理 Socket 的私有属性引用
      const socketAsAny = socket as unknown as Record<string, unknown>;
      if (socketAsAny._events) {
        socketAsAny._events = null;
      }
      if (socketAsAny._eventsCount) {
        socketAsAny._eventsCount = 0;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`清理 Socket 监听器时出错: ${message}`);
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
      const userId = this.verifyAndGetUserId(token);

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
      const userId = this.verifyAndGetUserId(token);

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
      const userId = this.verifyAndGetUserId(token);

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
   * ⭐️ 添加了错误处理和日志记录
   */
  private async broadcastUnreadCount(userId: string): Promise<void> {
    try {
      const unreadData = await this.notificationsService.getUnreadCount(userId);
      const userRoom = `user:${userId}:notifications`;

      // 检查房间是否存在
      if (this.server && this.server.sockets.adapter) {
        const room = this.server.sockets.adapter.rooms.get(userRoom);
        if (room && room.size > 0) {
          this.server
            .to(userRoom)
            .emit('notification:unread_count_updated', unreadData);
          this.logger.debug(
            `未读数量广播给用户 ${userId}: ${unreadData.unreadCount}`,
          );
        } else {
          this.logger.debug(`用户 ${userId} 不在线，跳过未读数量广播`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`广播未读数量时出错 (用户 ${userId}): ${message}`);
    }
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
   * 心跳处理 - 客户端定期发送 ping，服务器回复 pong
   * ⭐️ 用于检测僵死连接并保持连接活跃
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    try {
      // 更新客户端的最后活跃时间
      (client as unknown as { lastHeartbeat?: number }).lastHeartbeat =
        Date.now();

      // 回复 pong
      client.emit('pong', { timestamp: Date.now() });
      this.logger.debug(`收到来自 Socket ${client.id} 的心跳信号`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`处理心跳信号时出错: ${message}`);
    }
  }

  /**
   * 定期检查僵死连接（每 30 秒执行一次）
   * ⭐️ 移除超过 60 秒未活动的连接
   */
  private startHeartbeatMonitor(): void {
    const HEARTBEAT_INTERVAL = 30000; // 30 秒
    const HEARTBEAT_TIMEOUT = 60000; // 60 秒

    setInterval(() => {
      try {
        const now = Date.now();
        const socketIds = Array.from(this.server.sockets.sockets.keys());

        for (const socketId of socketIds) {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            const lastHeartbeat = (
              socket as unknown as { lastHeartbeat?: number }
            ).lastHeartbeat;
            const handshakeTime = socket.handshake.time || Date.now();

            // 如果没有心跳信息，使用连接时间
            const lastActiveTime = lastHeartbeat ?? handshakeTime;
            const timeSinceActive = now - (lastActiveTime as number);

            if (timeSinceActive > HEARTBEAT_TIMEOUT) {
              this.logger.warn(`Socket ${socketId} 已超时，正在断开连接`);
              socket.disconnect(true);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`心跳监控出错: ${message}`);
      }
    }, HEARTBEAT_INTERVAL);

    this.logger.log('WebSocket 心跳监控已启动 (间隔: 30秒, 超时: 60秒)');
  }

  /**
   * 模块销毁时清理资源
   * ⭐️ 改为异步方法，正确等待所有 Promise
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('清理 WebSocket 资源...');

      // 清理所有用户的 Socket 连接信息
      this.userSockets.clear();

      // 断开所有客户端连接
      if (this.server) {
        // ⭐️ 等待所有 socket 断开连接完成
        await this.server.disconnectSockets();
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
