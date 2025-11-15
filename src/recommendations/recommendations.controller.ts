import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

interface AuthUser {
  id: string;
  role: string;
}

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /**
   * 获取热门帖子
   * GET /recommendations/posts/hot?page=1&limit=20
   */
  @Public()
  @Get('posts/hot')
  async getHotPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getHotPosts(page, limit);
  }

  /**
   * 获取趋势帖子（新晋热门）
   * GET /recommendations/posts/trending?page=1&limit=20
   */
  @Public()
  @Get('posts/trending')
  async getTrendingPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getTrendingPosts(page, limit);
  }

  /**
   * 获取最新帖子
   * GET /recommendations/posts/latest?page=1&limit=20
   */
  @Public()
  @Get('posts/latest')
  async getLatestPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getLatestPosts(page, limit);
  }

  /**
   * 获取个性化推荐（基于用户关注）
   * GET /recommendations/personalized?page=1&limit=20
   */
  @Get('personalized')
  async getPersonalizedRecommendations(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getPersonalizedRecommendations(
      userId,
      page,
      limit,
    );
  }

  /**
   * 获取热门话题
   * GET /recommendations/topics/hot?page=1&limit=20
   */
  @Public()
  @Get('topics/hot')
  async getHotTopics(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getHotTopics(page, limit);
  }

  /**
   * 获取所有话题
   * GET /recommendations/topics?page=1&limit=20
   */
  @Public()
  @Get('topics')
  async getAllTopics(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1) throw new BadRequestException('页码必须大于0');
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('每页数量必须在1-100之间');
    }
    return this.recommendationsService.getAllTopics(page, limit);
  }
}
