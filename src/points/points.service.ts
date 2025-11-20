import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsAction } from '@prisma/client';

@Injectable()
export class PointsService {
    constructor(private prisma: PrismaService) { }

    private readonly POINTS_MAP = {
        POST_CREATED: 10,
        POST_DELETED: -10,
        COMMENT_CREATED: 5,
        COMMENT_DELETED: -5,
        RECEIVED_LIKE: 2,
        LIKE_REMOVED: -2,
        POST_HIGHLIGHTED: 50,
        DAILY_LOGIN: 1,
        CONTINUOUS_LOGIN: 5,
        ADMIN_REWARD: 0,
        ADMIN_PENALTY: 0,
    };

    private readonly LEVEL_THRESHOLDS = [
        0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500,
    ];

    async initUserPoints(userId: string) {
        return this.prisma.userPoints.create({
            data: { userId },
        });
    }

    async addPoints(
        userId: string,
        action: PointsAction,
        relatedId?: string,
        reason?: string,
        customPoints?: number,
    ) {
        let userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });

        if (!userPoints) {
            userPoints = await this.initUserPoints(userId);
        }

        const points = customPoints ?? this.POINTS_MAP[action];
        const newTotal = Math.max(0, userPoints.totalPoints + points);
        const newLevel = this.calculateLevel(newTotal);

        await this.prisma.$transaction([
            this.prisma.userPoints.update({
                where: { id: userPoints.id },
                data: {
                    totalPoints: newTotal,
                    level: newLevel,
                },
            }),
            this.prisma.userPointsHistory.create({
                data: {
                    userPointsId: userPoints.id,
                    action,
                    points,
                    reason,
                    relatedId,
                },
            }),
        ]);

        return {
            totalPoints: newTotal,
            level: newLevel,
            pointsChange: points,
        };
    }

    private calculateLevel(points: number): number {
        for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (points >= this.LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    async getUserPoints(userId: string) {
        let userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });

        if (!userPoints) {
            userPoints = await this.initUserPoints(userId);
        }

        const nextLevel = userPoints.level + 1;
        const nextLevelPoints = this.LEVEL_THRESHOLDS[nextLevel - 1] || 0;
        const progress =
            nextLevelPoints > 0
                ? (userPoints.totalPoints / nextLevelPoints) * 100
                : 100;

        return {
            ...userPoints,
            nextLevelPoints,
            progress: Math.min(progress, 100),
        };
    }

    async getPointsHistory(userId: string, page = 1, limit = 20) {
        const userPoints = await this.prisma.userPoints.findUnique({
            where: { userId },
        });

        if (!userPoints) {
            return { data: [], meta: { page, limit, total: 0 } };
        }

        const [data, total] = await Promise.all([
            this.prisma.userPointsHistory.findMany({
                where: { userPointsId: userPoints.id },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.userPointsHistory.count({
                where: { userPointsId: userPoints.id },
            }),
        ]);

        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async getLeaderboard(limit = 50) {
        return this.prisma.userPoints.findMany({
            orderBy: { totalPoints: 'desc' },
            take: limit,
            include: {
                user: {
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
}
