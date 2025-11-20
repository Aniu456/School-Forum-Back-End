import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * 用户动态流服务
 */
@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) { }

    /**
     * 获取关注用户的动态流
     * 聚合：新帖子、新评论、新公告等
     */
    async getFollowingActivities(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        // 获取关注的用户ID列表
        const following = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });

        const followingIds = following.map((f) => f.followingId);

        if (followingIds.length === 0) {
            return {
                data: [],
                meta: { page, limit, total: 0 },
            };
        }

        // 并行获取各类活动
        const [posts, comments, announcements] = await Promise.all([
            // 关注用户的新帖子
            this.prisma.post.findMany({
                where: {
                    authorId: { in: followingIds },
                    isHidden: false,
                },
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
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),

            // 关注用户的新评论
            this.prisma.comment.findMany({
                where: {
                    authorId: { in: followingIds },
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                        },
                    },
                    post: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),

            // 公告（如果关注的人是管理员）
            this.prisma.announcement.findMany({
                where: {
                    authorId: { in: followingIds },
                    isPublished: true,
                },
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
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);

        // 合并并排序所有活动
        const activities = [
            ...posts.map((p) => ({
                type: 'POST',
                id: p.id,
                author: p.author,
                content: p.title,
                createdAt: p.createdAt,
                data: p,
            })),
            ...comments.map((c) => ({
                type: 'COMMENT',
                id: c.id,
                author: c.author,
                content: c.content,
                postTitle: c.post.title,
                createdAt: c.createdAt,
                data: c,
            })),
            ...announcements.map((a) => ({
                type: 'ANNOUNCEMENT',
                id: a.id,
                author: a.author,
                content: a.title,
                createdAt: a.createdAt,
                data: a,
            })),
        ]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(skip, skip + limit);

        return {
            data: activities,
            meta: {
                page,
                limit,
                total: activities.length,
            },
        };
    }

    /**
     * 获取我的动态
     */
    async getMyActivities(userId: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [posts, comments] = await Promise.all([
            this.prisma.post.findMany({
                where: { authorId: userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            this.prisma.comment.findMany({
                where: { authorId: userId },
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);

        const activities = [
            ...posts.map((p) => ({
                type: 'POST',
                id: p.id,
                content: p.title,
                createdAt: p.createdAt,
                data: p,
            })),
            ...comments.map((c) => ({
                type: 'COMMENT',
                id: c.id,
                content: c.content,
                postTitle: c.post.title,
                createdAt: c.createdAt,
                data: c,
            })),
        ]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(skip, skip + limit);

        return {
            data: activities,
            meta: {
                page,
                limit,
                total: activities.length,
            },
        };
    }
}
