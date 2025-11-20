import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class RealtimeService {
    constructor(
        private prisma: PrismaService,
        private gateway: NotificationsGateway,
    ) { }

    /**
     * 广播新帖子给所有粉丝
     */
    async broadcastNewPost(postId: string, authorId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!post) return;

        const followers = await this.prisma.follow.findMany({
            where: { followingId: authorId },
            select: { followerId: true },
        });

        const authorName = post.author.nickname || post.author.username;

        for (const follower of followers) {
            const notification = await this.prisma.notification.create({
                data: {
                    userId: follower.followerId,
                    type: 'NEW_POST',
                    title: '关注的人发布了新帖子',
                    content: `${authorName} 发布了新帖子: ${post.title}`,
                    relatedId: postId,
                },
            });

            this.gateway.notifyUser(follower.followerId, notification);
        }

        this.broadcastPostToAll(post);
    }

    /**
     * 广播新帖子给所有在线用户
     */
    private broadcastPostToAll(post: any) {
        this.gateway.server.emit('post:new', {
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 200),
            author: post.author,
            createdAt: post.createdAt,
            tags: post.tags,
        });
    }

    /**
     * 通知新粉丝
     */
    async notifyNewFollower(followerId: string, followingId: string) {
        const follower = await this.prisma.user.findUnique({
            where: { id: followerId },
            select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
            },
        });

        if (!follower) return;

        const followerName = follower.nickname || follower.username;

        const notification = await this.prisma.notification.create({
            data: {
                userId: followingId,
                type: 'NEW_FOLLOWER',
                title: '新粉丝关注',
                content: `${followerName} 关注了你`,
                relatedId: followerId,
            },
        });

        this.gateway.notifyUser(followingId, notification);
    }

    /**
     * 广播新公告给所有在线用户（WS实时推送）
     */
    broadcastNewAnnouncement(announcement: any) {
        this.gateway.server.emit('announcement:new', {
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            createdAt: announcement.createdAt,
            isPinned: announcement.isPinned,
        });
    }
}
