import {
    Controller,
    Get,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';

/**
 * 用户动态流控制器
 * 聚合关注用户的各种活动：新帖、评论、公告等
 */
@Controller('activities')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    /**
     * 获取关注用户的动态流
     * GET /activities/following?page=1&limit=20
     */
    @Get('following')
    async getFollowingActivities(
        @CurrentUser('id') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.activitiesService.getFollowingActivities(userId, page, limit);
    }

    /**
     * 获取我的动态（我发布的内容）
     * GET /activities/my?page=1&limit=20
     */
    @Get('my')
    async getMyActivities(
        @CurrentUser('id') userId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.activitiesService.getMyActivities(userId, page, limit);
    }
}
