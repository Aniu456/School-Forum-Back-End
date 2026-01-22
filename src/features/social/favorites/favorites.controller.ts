import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator';

/**
 * 收藏控制器 - 简化版（无文件夹功能）
 */
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * 收藏帖子
   * POST /favorites
   */
  @Post()
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Body() dto: { postId: string; note?: string },
  ) {
    return this.favoritesService.addFavorite(userId, dto);
  }

  /**
   * 切换收藏状态
   * POST /favorites/toggle
   */
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @CurrentUser('id') userId: string,
    @Body() dto: { postId: string; note?: string },
  ) {
    return this.favoritesService.toggleFavorite(userId, dto.postId, dto.note);
  }

  /**
   * 取消收藏
   * DELETE /favorites/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(
    @CurrentUser('id') userId: string,
    @Param('id') favoriteId: string,
  ) {
    return this.favoritesService.removeFavorite(userId, favoriteId);
  }

  /**
   * 通过帖子ID取消收藏
   * DELETE /favorites/post/:postId
   */
  @Delete('post/:postId')
  @HttpCode(HttpStatus.OK)
  async removeFavoriteByPostId(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.favoritesService.removeFavoriteByPostId(userId, postId);
  }

  /**
   * 获取用户的收藏列表
   * GET /favorites
   */
  @Get()
  async getFavorites(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.favoritesService.getFavorites(userId, page, limit);
  }

  /**
   * 检查是否收藏了某帖子
   * GET /favorites/check/:postId
   */
  @Get('check/:postId')
  async checkFavorite(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ) {
    const isFavorited = await this.favoritesService.isFavorited(userId, postId);
    return { isFavorited };
  }
}
