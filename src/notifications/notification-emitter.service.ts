import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

/**
 * 通知发射器服务
 * 用于在创建通知时自动推送到 WebSocket
 */
@Injectable()
export class NotificationEmitterService {
  constructor(
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * 推送通知到用户
   */
  emitNotification(userId: string, notification: any) {
    // 如果用户在线，推送实时通知
    if (this.notificationsGateway.isUserOnline(userId)) {
      this.notificationsGateway.notifyUser(userId, notification);
    }
  }

  emitComment(data: any) {
    this.notificationsGateway.broadcastComment(data);
  }

  emitReply(data: any) {
    this.notificationsGateway.broadcastReply(data);
  }

  emitLike(data: any) {
    this.notificationsGateway.broadcastLike(data);
  }

  emitFollow(data: any) {
    this.notificationsGateway.broadcastFollow(data);
  }

  emitPostNew(data: any) {
    this.notificationsGateway.broadcastPostNew(data);
  }

  emitPostUpdate(data: any) {
    this.notificationsGateway.broadcastPostUpdate(data);
  }

  emitPostDelete(data: any) {
    this.notificationsGateway.broadcastPostDelete(data);
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: string): boolean {
    return this.notificationsGateway.isUserOnline(userId);
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUsersCount(): number {
    return this.notificationsGateway.getOnlineUsersCount();
  }

  /**
   * 广播在线用户数量
   */
  broadcastOnlineCount() {
    this.notificationsGateway.broadcastOnlineCount();
  }
}
