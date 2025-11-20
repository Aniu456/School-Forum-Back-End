import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceType } from '@prisma/client';

@Injectable()
export class StudyResourcesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any) {
        return this.prisma.studyResource.create({
            data: {
                ...data,
                authorId: userId,
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
        });
    }

    async findAll(
        page = 1,
        limit = 20,
        category?: string,
        type?: ResourceType,
    ) {
        const skip = (page - 1) * limit;
        const where: any = { isDeleted: false };
        if (category) where.category = category;
        if (type) where.type = type;

        const [resources, total] = await Promise.all([
            this.prisma.studyResource.findMany({
                where,
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
                skip,
                take: limit,
            }),
            this.prisma.studyResource.count({ where }),
        ]);

        return { data: resources, meta: { page, limit, total } };
    }

    async findOne(id: string) {
        const resource = await this.prisma.studyResource.findUnique({
            where: { id },
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

        if (resource && !resource.isDeleted) {
            await this.prisma.studyResource.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        }

        return resource;
    }

    async incrementDownload(id: string) {
        return this.prisma.studyResource.update({
            where: { id },
            data: { downloadCount: { increment: 1 } },
        });
    }

    async update(id: string, userId: string, data: any) {
        const resource = await this.prisma.studyResource.findUnique({
            where: { id },
        });

        if (!resource || resource.authorId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.studyResource.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        const resource = await this.prisma.studyResource.findUnique({
            where: { id },
        });

        if (!resource || resource.authorId !== userId) {
            throw new Error('无权限');
        }

        return this.prisma.studyResource.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
}
