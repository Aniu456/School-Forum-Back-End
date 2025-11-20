import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Role } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * 创建公告（管理员）
     */
    async create(authorId: string, dto: CreateAnnouncementDto) {
        const announcement = await this.prisma.announcement.create({
            data: {
                ...dto,
                authorId,
                publishedAt: dto.isPublished ? new Date() : null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
            },
        });

        // 如果公告已发布，发送系统通知
        if (dto.isPublished) {
            try {
                // 获取所有符合条件的用户
                const where: any = {};
                if (dto.targetRole && dto.targetRole !== 'ALL') {
                    where.role = dto.targetRole;
                }

                const users = await this.prisma.user.findMany({
                    where,
                    select: { id: true },
                });

                // 批量创建通知
                await Promise.all(
                    users.map((user) =>
                        this.notificationsService.create({
                            userId: user.id,
                            type: 'SYSTEM',
                            senderId: authorId,
                            title: '新公告',
                            content: `${announcement.title}`,
                            relatedId: announcement.id,
                        }),
                    ),
                );
            } catch (error) {
                console.error('Failed to send announcement notifications:', error);
            }
        }

        return announcement;
    }

    /**
     * 获取公告列表
     */
    async findAll(page: number = 1, limit: number = 20, userRole?: Role) {
        const skip = (page - 1) * limit;

        const where: any = {
            isPublished: true,
            isHidden: false,
        };

        // 根据用户角色过滤
        if (userRole) {
            where.OR = [
                { targetRole: null }, // 所有人可见
                { targetRole: userRole }, // 特定角色可见
            ];
        } else {
            where.targetRole = null; // 未登录用户只能看所有人的公告
        }

        const [data, total] = await Promise.all([
            this.prisma.announcement.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                        },
                    },
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            this.prisma.announcement.count({ where }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    /**
     * 获取公告详情
     */
    async findOne(id: string) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
            },
        });

        if (!announcement) {
            throw new NotFoundException('公告不存在');
        }

        return announcement;
    }

    /**
     * 更新公告（管理员）
     */
    async update(id: string, dto: UpdateAnnouncementDto) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            throw new NotFoundException('公告不存在');
        }

        const updateData: any = { ...dto };

        // 如果从未发布变为发布，设置发布时间
        if (dto.isPublished && !announcement.isPublished) {
            updateData.publishedAt = new Date();
        }

        const updated = await this.prisma.announcement.update({
            where: { id },
            data: updateData,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                    },
                },
            },
        });

        return updated;
    }

    /**
     * 删除公告（管理员）
     */
    async remove(id: string) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            throw new NotFoundException('公告不存在');
        }

        await this.prisma.announcement.delete({
            where: { id },
        });

        return { message: '公告删除成功' };
    }

    /**
     * 隐藏/显示公告
     */
    async toggleHidden(id: string, isHidden: boolean) {
        const announcement = await this.prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            throw new NotFoundException('公告不存在');
        }

        await this.prisma.announcement.update({
            where: { id },
            data: { isHidden },
        });

        return {
            message: isHidden ? '公告已隐藏' : '公告已显示',
        };
    }

    /**
     * 获取所有公告（管理员）
     */
    async findAllForAdmin(page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.announcement.findMany({
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                        },
                    },
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: limit,
            }),
            this.prisma.announcement.count(),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
}
