import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CarpoolType, CarpoolStatus } from '@prisma/client';

@Injectable()
export class CarpoolService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        return this.prisma.carpool.create({
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
        type?: CarpoolType,
        status?: CarpoolStatus,
    ) {
        const skip = (page - 1) * limit;
        const where: any = { isDeleted: false };
        if (type) where.type = type;
        if (status) where.status = status;

        const [carpools, total] = await Promise.all([
            this.prisma.carpool.findMany({
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
                orderBy: { departureTime: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.carpool.count({ where }),
        ]);

        return { data: carpools, meta: { page, limit, total } };
    }

    async findOne(id: string) {
        return this.prisma.carpool.findUnique({
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
        const carpool = await this.prisma.carpool.findUnique({
            where: { id },
        });

        if (!carpool || carpool.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.carpool.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        const carpool = await this.prisma.carpool.findUnique({
            where: { id },
        });

        if (!carpool || carpool.publisherId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.carpool.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
