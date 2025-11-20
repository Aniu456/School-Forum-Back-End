import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../core/common/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 搜索帖子
   * GET /search/posts
   */
  @Public()
  @Get('posts')
  async searchPosts(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('relevance'))
    sortBy: 'relevance' | 'createdAt' | 'viewCount',
    @Query('tag') tag?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('搜索关键词不能为空');
    }

    return this.searchService.searchPosts(query, page, limit, sortBy, tag);
  }

  /**
   * 搜索用户
   * GET /search/users
   */
  @Public()
  @Get('users')
  async searchUsers(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('搜索关键词不能为空');
    }

    return this.searchService.searchUsers(query, page, limit);
  }

  /**
   * 获取热门标签
   * GET /search/tags/popular
   */
  @Public()
  @Get('tags/popular')
  async getPopularTags(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.searchService.getPopularTags(limit);
  }
}
