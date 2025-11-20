import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LostFoundType, LostFoundStatus } from '@prisma/client';

@Injectable()
export class LostFoundService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        return this.prisma.lostAndFound.create({
            data: {
                ...data,
                publisherId: userId,
            },
            include: {
                publisher: {
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

    async findAll(
        page = 1,
        limit = 20,
        type?: LostFoundType,
        status?: LostFoundStatus,
        category?: string,
    ) {
        const skip = (page - 1) * limit;
        const where: any = { isDeleted: false };
        if (type) where.type = type;
        if (status) where.status = status;
        if (category) where.category = category;

        const [items, total] = await Promise.all([
            this.prisma.lostAndFound.findMany({
                where,
                include: {
                    publisher: {
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
            this.prisma.lostAndFound.count({ where }),
        ]);

        return { data: items, meta: { page, limit, total } };
    }

    async findOne(id: string) {
        return this.prisma.lostAndFound.findUnique({
            where: { id },
            include: {
                publisher: {
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

    async update(id: string, userId: string, data: any) {
        const item = await this.prisma.lostAndFound.findUnique({
            where: { id },
        });

        if (!item || item.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.lostAndFound.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        const item = await this.prisma.lostAndFound.findUnique({
            where: { id },
        });

        if (!item || item.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.lostAndFound.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
