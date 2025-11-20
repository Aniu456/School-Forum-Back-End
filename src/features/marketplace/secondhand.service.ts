import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ItemStatus } from '@prisma/client';

@Injectable()
export class SecondhandService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        return this.prisma.secondhandItem.create({
            data: {
                ...data,
                sellerId: userId,
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async findAll(page = 1, limit = 20, category?: string, status?: ItemStatus) {
        const skip = (page - 1) * limit;
        const where: any = { isDeleted: false };
        if (category) where.category = category;

        // 默认只展示未售出的记录；如显式传入 status 则按指定状态筛选
        if (status) {
            where.status = status;
        } else {
            where.status = { not: ItemStatus.SOLD };
        }

        const [items, total] = await Promise.all([
            this.prisma.secondhandItem.findMany({
                where,
                include: {
                    seller: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.secondhandItem.count({ where }),
        ]);

        return { data: items, meta: { page, limit, total } };
    }

    async findOne(id: string) {
        const item = await this.prisma.secondhandItem.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                    },
                },
            },
        });

        if (item && !item.isDeleted) {
            await this.prisma.secondhandItem.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return item;
    }

    async update(id: string, userId: string, data: any) {
        const item = await this.prisma.secondhandItem.findUnique({
            where: { id },
        });

        if (!item || item.sellerId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.secondhandItem.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        const item = await this.prisma.secondhandItem.findUnique({
            where: { id },
        });

        if (!item || item.sellerId !== userId) {
            throw new Error('无权限');
        }

        // 软删除：标记为已删除
        return this.prisma.secondhandItem.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
