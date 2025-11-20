import {
    Controller,
    Get,
    Query,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Public } from '../../core/common/decorators/public.decorator';
import { SERVICE_CENTER_TAGS, SERVICE_CENTER_CATEGORIES } from '../../common/constants/tags';

/**
 * 服务中心专用控制器
 * 提供垂直场景的专用接口
 */
@Controller('service-center')
export class ServiceCenterController {
    constructor(private readonly postsService: PostsService) { }

    /**
     * 获取所有服务中心分类
     * GET /service-center/categories
     */
    @Public()
    @Get('categories')
    async getCategories() {
        return {
            data: SERVICE_CENTER_CATEGORIES,
            message: '获取服务中心分类成功',
        };
    }

    /**
     * 获取社团招新列表
     * GET /service-center/club-recruitment?page=1&limit=20
     */
    @Public()
    @Get('club-recruitment')
    async getClubRecruitment(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.postsService.findAll(
            page,
            limit,
            'createdAt',
            'desc',
            SERVICE_CENTER_TAGS.CLUB_RECRUITMENT,
        );
    }

    /**
     * 获取失物招领列表
     * GET /service-center/lost-and-found?page=1&limit=20
     */
    @Public()
    @Get('lost-and-found')
    async getLostAndFound(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.postsService.findAll(
            page,
            limit,
            'createdAt',
            'desc',
            SERVICE_CENTER_TAGS.LOST_AND_FOUND,
        );
    }

    /**
     * 获取拼车拼单列表
     * GET /service-center/carpool?page=1&limit=20
     */
    @Public()
    @Get('carpool')
    async getCarpool(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.postsService.findAll(
            page,
            limit,
            'createdAt',
            'desc',
            SERVICE_CENTER_TAGS.CARPOOL,
        );
    }

    /**
     * 获取二手交易列表
     * GET /service-center/secondhand?page=1&limit=20
     */
    @Public()
    @Get('secondhand')
    async getSecondhand(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.postsService.findAll(
            page,
            limit,
            'createdAt',
            'desc',
            SERVICE_CENTER_TAGS.SECONDHAND,
        );
    }

    /**
     * 获取学习资源列表
     * GET /service-center/study-resource?page=1&limit=20
     */
    @Public()
    @Get('study-resource')
    async getStudyResource(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.postsService.findAll(
            page,
            limit,
            'createdAt',
            'desc',
            SERVICE_CENTER_TAGS.STUDY_RESOURCE,
        );
    }
}
