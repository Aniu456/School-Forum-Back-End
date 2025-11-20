import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecruitmentStatus } from '@prisma/client';

@Injectable()
export class ClubsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        return this.prisma.clubRecruitment.create({
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
        category?: string,
        status?: RecruitmentStatus,
    ) {
        const skip = (page - 1) * limit;
        const where: any = { isDeleted: false };
        if (category) where.category = category;
        if (status) where.status = status;

        const [recruitments, total] = await Promise.all([
            this.prisma.clubRecruitment.findMany({
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
            this.prisma.clubRecruitment.count({ where }),
        ]);

        return { data: recruitments, meta: { page, limit, total } };
    }

    async findOne(id: string) {
        const recruitment = await this.prisma.clubRecruitment.findUnique({
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

        if (recruitment && !recruitment.isDeleted) {
            await this.prisma.clubRecruitment.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return recruitment;
    }

    async update(id: string, userId: string, data: any) {
        const recruitment = await this.prisma.clubRecruitment.findUnique({
            where: { id },
        });

        if (!recruitment || recruitment.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.clubRecruitment.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        const recruitment = await this.prisma.clubRecruitment.findUnique({
            where: { id },
        });

        if (!recruitment || recruitment.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.clubRecruitment.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
