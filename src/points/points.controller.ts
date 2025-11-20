import { Controller, Get, Query, Req } from '@nestjs/common';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
    constructor(private pointsService: PointsService) { }

    @Get('me')
    async getMyPoints(@Req() req: any) {
        return this.pointsService.getUserPoints(req.user.id);
    }

    @Get('history')
    async getHistory(
        @Req() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page) : 1;
        const limitNum = limit ? parseInt(limit) : 20;
        return this.pointsService.getPointsHistory(req.user.id, pageNum, limitNum);
    }

    @Get('leaderboard')
    async getLeaderboard(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 50;
        return this.pointsService.getLeaderboard(limitNum);
    }
}
