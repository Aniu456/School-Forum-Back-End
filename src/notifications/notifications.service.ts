import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '@prisma/client';
import { NotificationEmitterService } from './notification-emitter.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationEmitterService))
    private emitter: NotificationEmitterService,
  ) {}

  /**
   * 创建通知
   */
  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
    });

    // 实时推送
    if (notification && notification.userId) {
      this.emitter.emitNotification(notification.userId, notification);
    }

    return notification;
  }

  /**
   * 获取用户通知列表
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isRead?: boolean,
    type?: NotificationType,
  ) {
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    // 获取通知列表和总数
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    // 私信通知聚合：同一会话仅保留最新一条，计算未读总数（type: SYSTEM 且存在 relatedId -> 私信会话）
    const aggregated: any[] = [];
    const map = new Map<string, any>();

    notifications.forEach((n) => {
      const isPm =
        n.type === NotificationType.SYSTEM &&
        n.relatedId !== null &&
        n.relatedId !== undefined;

      if (!isPm) {
        aggregated.push(n);
        return;
      }

      const key = `pm-${n.relatedId}`;
      if (!map.has(key)) {
        map.set(key, {
          ...n,
          aggregatedIds: [n.id],
          aggregatedCount: 1,
          aggregatedUnread: n.isRead ? 0 : 1,
        });
      } else {
        const exist = map.get(key);
        exist.aggregatedIds.push(n.id);
        exist.aggregatedCount += 1;
        exist.aggregatedUnread += n.isRead ? 0 : 1;
        // 保留最新一条为基准，其他聚合信息已叠加
        map.set(key, exist);
      }
    });

    // 将聚合的 pm 加入返回列表（保持整体按时间排序，新数在前）
    map.forEach((val) => aggregated.push(val));

    aggregated.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      data: aggregated,
      meta: {
        page,
        limit,
        total: aggregated.length,
        unreadCount,
      },
    };
  }

  /**
   * 标记单个通知为已读
   */
  async markAsRead(notificationId: string, userId: string) {
    // 检查通知是否存在且属于该用户
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('无权限操作此通知');
    }

    // 标记为已读
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    return updated;
  }

  /**
   * 批量标记所有通知为已读
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      message: '所有通知已标记为已读',
      count: result.count,
    };
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * 删除通知
   */
  async remove(notificationId: string, userId: string) {
    // 检查通知是否存在且属于该用户
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('无权限删除此通知');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { message: '通知删除成功' };
  }

  /**
   * 按 relatedId 批量标记为已读（用于私信聚合）
   */
  async markByRelated(
    userId: string,
    relatedId: string,
    type?: NotificationType,
  ) {
    const where: any = { userId, relatedId };
    if (type) {
      where.type = type;
    }

    const result = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return { message: '相关通知已标记为已读', count: result.count };
  }

  /**
   * 创建评论通知
   */
  async createCommentNotification(
    postAuthorId: string,
    commentAuthorName: string,
    postId: string,
  ) {
    return this.create({
      userId: postAuthorId,
      type: NotificationType.COMMENT,
      title: '新评论通知',
      content: `${commentAuthorName} 评论了你的帖子`,
      relatedId: postId,
    });
  }

  /**
   * 创建回复通知
   */
  async createReplyNotification(
    commentAuthorId: string,
    replyAuthorName: string,
    commentId: string,
  ) {
    return this.create({
      userId: commentAuthorId,
      type: NotificationType.REPLY,
      title: '新回复通知',
      content: `${replyAuthorName} 回复了你的评论`,
      relatedId: commentId,
    });
  }

  /**
   * 创建点赞通知
   */
  async createLikeNotification(
    targetAuthorId: string,
    likerName: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ) {
    const contentMap = {
      post: `${likerName} 点赞了你的帖子`,
      comment: `${likerName} 点赞了你的评论`,
    };

    return this.create({
      userId: targetAuthorId,
      type: NotificationType.LIKE,
      title: '点赞通知',
      content: contentMap[targetType],
      relatedId: targetId,
    });
  }

  /**
   * 创建系统通知
   */
  async createSystemNotification(
    userId: string,
    title: string,
    content: string,
  ) {
    return this.create({
      userId,
      type: NotificationType.SYSTEM,
      title,
      content,
    });
  }
}
