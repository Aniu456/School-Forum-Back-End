import {
  Controller,
  Post,
  Get,
  Patch,
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
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CreateFolderDto, UpdateFolderDto } from './dto/create-folder.dto';
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) { }

  /**
   * 创建收藏夹
   * POST /favorites/folders
   */
  @Post('folders')
  async createFolder(
    @CurrentUser('id') userId: string,
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return this.favoritesService.createFolder(userId, createFolderDto);
  }

  /**
   * 获取收藏夹列表
   * GET /favorites/folders
   */
  @Get('folders')
  async getFolders(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.favoritesService.getFolders(userId, page, limit);
  }

  /**
   * 获取单个收藏夹详情
   * GET /favorites/folders/:id
   */
  @Get('folders/:id')
  async getFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
  ) {
    return this.favoritesService.getFolder(userId, folderId);
  }

  /**
   * 更新收藏夹
   * PATCH /favorites/folders/:id
   */
  @Patch('folders/:id')
  async updateFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return this.favoritesService.updateFolder(
      userId,
      folderId,
      updateFolderDto,
    );
  }

  /**
   * 删除收藏夹
   * DELETE /favorites/folders/:id
   */
  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFolder(
    @CurrentUser('id') userId: string,
    @Param('id') folderId: string,
  ) {
    return this.favoritesService.deleteFolder(userId, folderId);
  }

  /**
   * 收藏帖子
   * POST /favorites
   */
  @Post()
  async addFavorite(
    @CurrentUser('id') userId: string,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(userId, createFavoriteDto);
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
   * 获取收藏夹中的帖子列表
   * GET /favorites/folders/:folderId/posts
   */
  @Get('folders/:folderId/posts')
  async getFavorites(
    @CurrentUser('id') userId: string,
    @Param('folderId') folderId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.favoritesService.getFavorites(userId, folderId, page, limit);
  }
}
