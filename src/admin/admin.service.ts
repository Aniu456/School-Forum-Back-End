import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    /**
     * 通用方法：查找用户或抛出异常
     * 避免重复的 findUnique + 检查逻辑
     */
    private async findUserOrThrow(
        userId: string,
        select?: Record<string, any>,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select,
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return user;
    }

    /**
     * 通用方法：查找帖子或抛出异常
     */
    private async findPostOrThrow(postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('帖子不存在');
        }

        return post;
    }

    /**
     * 通用方法：查找评论或抛出异常
     */
    private async findCommentOrThrow(commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('评论不存在');
        }

        return comment;
    }

    /**
     * 通用方法：检查用户是否为管理员
     */
    private checkNotAdmin(user: { role: Role }) {
        if (user.role === Role.ADMIN) {
            throw new ForbiddenException('不能对管理员执行此操作');
        }
    }

    /**
     * 获取用户列表（管理员），排除当前管理员自己
     */
    async getUsers(
        currentUserId: string,
        page: number = 1,
        limit: number = 20,
        role?: Role,
        isBanned?: boolean,
        keyword?: string,
    ) {
        const skip = (page - 1) * limit;

        const where: any = {
            id: { not: currentUserId },
        };
        if (role) {
            where.role = role;
        }
        if (isBanned !== undefined) {
            where.isBanned = isBanned;
        }
        if (keyword) {
            where.OR = [
                { username: { contains: keyword, mode: 'insensitive' } },
                { nickname: { contains: keyword, mode: 'insensitive' } },
                { email: { contains: keyword, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    nickname: true,
                    avatar: true,
                    role: true,
                    isActive: true,
                    isBanned: true,
                    canPost: true,
                    canComment: true,
                    followerCount: true,
                    followingCount: true,
                    createdAt: true,
                    _count: {
                        select: {
                            posts: true,
                            comments: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map((user) => ({
                ...user,
                postCount: user._count.posts,
                commentCount: user._count.comments,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * 封禁用户（管理员）
     */
    async banUser(userId: string) {
        const user = await this.findUserOrThrow(userId, { role: true });
        this.checkNotAdmin(user);

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: true },
        });

        return { message: '用户已封禁', user: updatedUser };
    }

    /**
     * 解封用户（管理员）
     */
    async unbanUser(userId: string) {
        await this.findUserOrThrow(userId);

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: false },
        });

        return { message: '用户已解封', user: updatedUser };
    }

    /**
     * 获取系统统计数据
     */
    /**
     * 删除用户（管理员）
     */
    async deleteUser(userId: string) {
        const user = await this.findUserOrThrow(userId, { role: true });
        this.checkNotAdmin(user);

        await this.prisma.user.delete({
            where: { id: userId },
        });

        return {
            message: '用户删除成功',
        };
    }

    /**
     * 删除单条评论（管理员）
     */
    async deleteComment(commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('评论不存在');
        }

        // 🛡️ 统计该评论及其所有子回复的数量
        const childCount = await this.prisma.comment.count({
            where: { parentId: commentId },
        });
        const totalDeleteCount = 1 + childCount;

        // 使用事务同步更新帖子评论数
        await this.prisma.$transaction(async (tx) => {
            // 先删除所有子回复
            if (childCount > 0) {
                await tx.comment.deleteMany({
                    where: { parentId: commentId },
                });
            }

            // 再删除父评论
            await tx.comment.delete({
                where: { id: commentId },
            });

            // 更新帖子评论数
            const post = await tx.post.findUnique({
                where: { id: comment.postId },
                select: { commentCount: true },
            });
            if (post && post.commentCount > 0) {
                const newCount = Math.max(0, post.commentCount - totalDeleteCount);
                await tx.post.update({
                    where: { id: comment.postId },
                    data: { commentCount: newCount },
                });
            }
        });

        return {
            message: '评论删除成功',
            deletedCount: totalDeleteCount,
        };
    }

    async getStatistics() {
        const [totalUsers, activeUsers, bannedUsers, totalPosts, totalComments] =
            await Promise.all([
                this.prisma.user.count(),
                this.prisma.user.count({ where: { isActive: true } }),
                this.prisma.user.count({ where: { isBanned: true } }),
                this.prisma.post.count(),
                this.prisma.comment.count(),
            ]);

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
            },
            posts: {
                total: totalPosts,
            },
            comments: {
                total: totalComments,
            },
        };
    }

    /**
     * 重置用户密码
     */
    async resetUserPassword(userId: string, newPassword: string) {
        await this.findUserOrThrow(userId);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: '密码重置成功' };
    }

    /**
     * 修改用户角色（不能修改超级管理员）
     */
    async updateUserRole(userId: string, role: Role) {
        await this.findUserOrThrow(userId);

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        return { message: '角色更新成功', user: updatedUser };
    }

    /**
     * 查看用户登录历史 - DISABLED
     * UserLoginHistory table has been removed to simplify the schema.
     * Only the last login info (lastLoginAt, lastLoginIp) is kept in the User table.
     */
    async getUserLoginHistory(userId: string, page: number, limit: number) {
        // Return the last login info from User table instead
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                lastLoginAt: true,
                lastLoginIp: true,
            },
        });

        if (!user) {
            return {
                data: [],
                meta: { page, limit, total: 0, totalPages: 0 },
            };
        }

        // Return only the most recent login as a single record
        const data = user.lastLoginAt ? [{
            id: user.id,
            userId: user.id,
            loginIp: user.lastLoginIp || 'Unknown',
            loginTime: user.lastLoginAt,
            userAgent: null,
            device: null,
            location: null,
        }] : [];

        return {
            data,
            meta: {
                page: 1,
                limit: 1,
                total: data.length,
                totalPages: 1,
            },
        };
    }

    /**
     * 禁止/允许用户发帖
     */
    async togglePostPermission(userId: string, canPost: boolean) {
        await this.findUserOrThrow(userId);

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { canPost },
        });

        return {
            message: canPost ? '已允许用户发帖' : '已禁止用户发帖',
            user: updatedUser,
        };
    }

    /**
     * 禁止/允许用户评论
     */
    async toggleCommentPermission(userId: string, canComment: boolean) {
        await this.findUserOrThrow(userId);

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { canComment },
        });

        return {
            message: canComment ? '已允许用户评论' : '已禁止用户评论',
            user: updatedUser,
        };
    }

    /**
     * 获取帖子详情（管理员）
     */
    async getPostDetail(postId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });

        if (!post) {
            throw new NotFoundException('帖子不存在');
        }

        return post;
    }

    /**
     * 获取帖子列表（管理员）
     */
    async getPosts(
        page: number,
        limit: number,
        isPinned?: boolean,
        isHighlighted?: boolean,
        keyword?: string,
        authorId?: string,
        tag?: string,
    ) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (isPinned !== undefined) {
            where.isPinned = isPinned;
        }
        if (isHighlighted !== undefined) {
            where.isHighlighted = isHighlighted;
        }
        if (keyword) {
            where.OR = [
                { title: { contains: keyword, mode: 'insensitive' } },
                { content: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        if (authorId) {
            where.authorId = authorId;
        }
        if (tag) {
            where.tags = { has: tag };
        }

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
            }),
            this.prisma.post.count({ where }),
        ]);

        return {
            data: posts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * 获取评论详情（管理员）
     */
    async getCommentDetail(commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
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
                        author: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                            },
                        },
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        author: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                            },
                        },
                    },
                },
            },
        });

        if (!comment) {
            throw new NotFoundException('评论不存在');
        }

        return comment;
    }

    /**
     * 获论列表（管理员）
     */
    async getComments(
        page: number,
        limit: number,
        keyword?: string,
        authorId?: string,
        postId?: string,
    ) {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (keyword) {
            where.content = { contains: keyword, mode: 'insensitive' };
        }
        if (authorId) {
            where.authorId = authorId;
        }
        if (postId) {
            where.postId = postId;
        }

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
            }),
            this.prisma.comment.count({ where }),
        ]);

        return {
            data: comments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * 置顶帖子
     */
    async pinPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isPinned: true, pinnedAt: new Date() },
        });

        return { message: '帖子已置顶', post: updatedPost };
    }

    /**
     * 取消置顶帖子
     */
    async unpinPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isPinned: false, pinnedAt: null },
        });

        return { message: '已取消置顶', post: updatedPost };
    }

    /**
     * 加精华
     */
    async highlightPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isHighlighted: true, highlightedAt: new Date() },
        });

        return { message: '帖子已加精', post: updatedPost };
    }

    /**
     * 取消精华
     */
    async unhighlightPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isHighlighted: false, highlightedAt: null },
        });

        return { message: '已取消精华', post: updatedPost };
    }

    /**
     * 锁定帖子（禁止评论）
     */
    async lockPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isLocked: true },
        });

        return { message: '帖子已锁定', post: updatedPost };
    }

    /**
     * 解锁帖子
     */
    async unlockPost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isLocked: false },
        });

        return { message: '帖子已解锁', post: updatedPost };
    }

    /**
     * 隐藏帖子
     */
    async hidePost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isHidden: true },
        });

        return { message: '帖子已隐藏', post: updatedPost };
    }

    /**
     * 取消隐藏帖子
     */
    async unhidePost(postId: string) {
        await this.findPostOrThrow(postId);

        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { isHidden: false },
        });

        return { message: '已取消隐藏', post: updatedPost };
    }

    /**
     * 批量删除帖子
     */
    async bulkDeletePosts(ids: string[]) {
        // Prisma 的 CASCADE 会自动删除关联的评论、点赞等
        const result = await this.prisma.post.deleteMany({
            where: { id: { in: ids } },
        });

        return { message: `已删除 ${result.count} 个帖子` };
    }

    /**
     * 批量删除评论
     * 🛡️ 修复：统计子回复数量，确保 commentCount 准确
     */
    async bulkDeleteComments(ids: string[]) {
        // 先获取所有要删除的评论及其所属帖子
        const comments = await this.prisma.comment.findMany({
            where: { id: { in: ids } },
            select: { id: true, postId: true },
        });

        if (comments.length === 0) {
            return { message: '没有找到要删除的评论' };
        }

        // 🛡️ 统计每个选中评论的子回复数量
        const childCounts = await this.prisma.comment.groupBy({
            by: ['parentId'],
            where: { parentId: { in: ids } },
            _count: { id: true },
        });

        const childCountMap = new Map<string, number>();
        childCounts.forEach(item => {
            if (item.parentId) {
                childCountMap.set(item.parentId, item._count.id);
            }
        });

        // 统计每个帖子需要减少的评论数（父评论 + 子回复）
        const postCommentCounts = new Map<string, number>();
        comments.forEach(comment => {
            const count = postCommentCounts.get(comment.postId) || 0;
            const childCount = childCountMap.get(comment.id) || 0;
            postCommentCounts.set(comment.postId, count + 1 + childCount);
        });

        // 使用事务批量删除评论并更新计数
        await this.prisma.$transaction(async (tx) => {
            // 先删除所有子回复
            await tx.comment.deleteMany({
                where: { parentId: { in: ids } },
            });

            // 再删除选中的评论
            await tx.comment.deleteMany({
                where: { id: { in: ids } },
            });

            // 更新各帖子的评论数
            const updatePromises = Array.from(postCommentCounts.entries()).map(
                ([postId, decrementCount]) => {
                    return tx.post.findUnique({
                        where: { id: postId },
                        select: { commentCount: true },
                    }).then(post => {
                        if (post && post.commentCount > 0) {
                            const newCount = Math.max(0, post.commentCount - decrementCount);
                            return tx.post.update({
                                where: { id: postId },
                                data: { commentCount: newCount },
                            });
                        }
                        return null;
                    });
                }
            );

            await Promise.all(updatePromises.filter(Boolean));
        });

        const totalDeleted = Array.from(postCommentCounts.values()).reduce((sum, count) => sum + count, 0);
        return { message: `已删除 ${totalDeleted} 条评论（含子回复）` };
    }
}
