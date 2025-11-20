import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersActivityService {
    constructor(private prisma: PrismaService) { }

    async getUserActivity(userId: string, type?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        switch (type) {
            case 'posts':
                return this.getUserPosts(userId, skip, limit);
            case 'comments':
                return this.getUserComments(userId, skip, limit);
            case 'likes':
                return this.getUserLikes(userId, skip, limit);
            case 'favorites':
                return this.getUserFavorites(userId, skip, limit);
            case 'following':
                return this.getUserFollowing(userId, skip, limit);
            case 'followers':
                return this.getUserFollowers(userId, skip, limit);
            default:
                return this.getAllActivity(userId);
        }
    }

    private async getUserPosts(userId: string, skip: number, limit: number) {
        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where: { authorId: userId, isDeleted: false },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    tags: true,
                    viewCount: true,
                    likeCount: true,
                    commentCount: true,
                    createdAt: true,
                },
            }),
            this.prisma.post.count({
                where: { authorId: userId, isDeleted: false },
            }),
        ]);

        return { data: posts, meta: { skip, limit, total } };
    }

    private async getUserComments(userId: string, skip: number, limit: number) {
        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { authorId: userId, isDeleted: false },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            }),
            this.prisma.comment.count({
                where: { authorId: userId, isDeleted: false },
            }),
        ]);

        return { data: comments, meta: { skip, limit, total } };
    }

    private async getUserLikes(userId: string, skip: number, limit: number) {
        const [likes, total] = await Promise.all([
            this.prisma.like.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.like.count({ where: { userId } }),
        ]);

        const postIds = likes
            .filter((l) => l.targetType === 'POST')
            .map((l) => l.targetId);
        const posts = await this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: { id: true, username: true, nickname: true, avatar: true },
                },
            },
        });

        return { data: { likes, posts }, meta: { skip, limit, total } };
    }

    private async getUserFavorites(userId: string, skip: number, limit: number) {
        const [favorites, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    post: {
                        select: {
                            id: true,
                            title: true,
                            content: true,
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    nickname: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                    folder: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            this.prisma.favorite.count({ where: { userId } }),
        ]);

        return { data: favorites, meta: { skip, limit, total } };
    }

    private async getUserFollowing(userId: string, skip: number, limit: number) {
        const [following, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followerId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                            bio: true,
                            followerCount: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({ where: { followerId: userId } }),
        ]);

        return {
            data: following.map((f) => f.following),
            meta: { skip, limit, total },
        };
    }

    private async getUserFollowers(userId: string, skip: number, limit: number) {
        const [followers, total] = await Promise.all([
            this.prisma.follow.findMany({
                where: { followingId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                            bio: true,
                            followerCount: true,
                        },
                    },
                },
            }),
            this.prisma.follow.count({ where: { followingId: userId } }),
        ]);

        return {
            data: followers.map((f) => f.follower),
            meta: { skip, limit, total },
        };
    }

    private async getAllActivity(userId: string) {
        const [posts, comments, likes, favorites, following, followers] =
            await Promise.all([
                this.prisma.post.count({
                    where: { authorId: userId, isDeleted: false },
                }),
                this.prisma.comment.count({
                    where: { authorId: userId, isDeleted: false },
                }),
                this.prisma.like.count({ where: { userId } }),
                this.prisma.favorite.count({ where: { userId } }),
                this.prisma.follow.count({ where: { followerId: userId } }),
                this.prisma.follow.count({ where: { followingId: userId } }),
            ]);

        const recentPosts = await this.prisma.post.findMany({
            where: { authorId: userId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                createdAt: true,
                viewCount: true,
                likeCount: true,
                commentCount: true,
            },
        });

        const recentComments = await this.prisma.comment.findMany({
            where: { authorId: userId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                post: {
                    select: { id: true, title: true },
                },
            },
        });

        return {
            stats: {
                totalPosts: posts,
                totalComments: comments,
                totalLikes: likes,
                totalFavorites: favorites,
                totalFollowing: following,
                totalFollowers: followers,
            },
            recentPosts,
            recentComments,
        };
    }
}
