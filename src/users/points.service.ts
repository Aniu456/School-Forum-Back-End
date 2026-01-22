import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

/**
 * PointsService - DISABLED
 * 
 * This service has been disabled because the UserPoints and UserPointsHistory
 * tables were removed from the schema to simplify the database structure.
 * 
 * If you need points functionality in the future, you can:
 * 1. Re-add the UserPoints and UserPointsHistory models to schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Uncomment the implementation below
 */
@Injectable()
export class PointsService {
    constructor(private prisma: PrismaService) { }

    // All methods are now no-ops to prevent errors
    async initUserPoints(_userId: string) {
        console.warn('PointsService is disabled - UserPoints table removed');
        return null;
    }

    async addPoints(
        _userId: string,
        _action: string,
        _relatedId?: string,
        _reason?: string,
        _customPoints?: number,
    ) {
        console.warn('PointsService is disabled - UserPoints table removed');
        return {
            totalPoints: 0,
            level: 1,
            pointsChange: 0,
        };
    }

    async getUserPoints(userId: string) {
        console.warn('PointsService is disabled - UserPoints table removed');
        return {
            id: '',
            userId,
            totalPoints: 0,
            level: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            nextLevelPoints: 100,
            progress: 0,
        };
    }

    async getPointsHistory(_userId: string, page = 1, _limit = 20) {
        console.warn('PointsService is disabled - UserPoints table removed');
        return { data: [], meta: { page, limit: _limit, total: 0, totalPages: 0 } };
    }

    async getLeaderboard(_limit = 50) {
        console.warn('PointsService is disabled - UserPoints table removed');
        return [];
    }
}
