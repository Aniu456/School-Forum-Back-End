import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator';
import { CreateFollowDto } from './dto/create-follow.dto';
import { FollowsService } from './follows.service';

@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /**
   * 关注用户
   * POST /users/:id/follow
   */
  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('id', ParseUUIDPipe) followingId: string,
    @CurrentUser('id') userId: string,
  ) {
    const createFollowDto: CreateFollowDto = { followingId };
    return this.followsService.follow(userId, createFollowDto);
  }

  /**
   * 取消关注用户
   * DELETE /users/:id/follow
   */
  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('id', ParseUUIDPipe) followingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.followsService.unfollow(userId, followingId);
  }

  /**
   * 获取是否已关注状态
   * GET /users/:id/follow/status
   */
  @Get(':id/follow/status')
  async getFollowStatus(
    @Param('id', ParseUUIDPipe) targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isFollowing = await this.followsService.isFollowing(
      userId,
      targetUserId,
    );
    return { isFollowing };
  }

  /**
   * 获取用户关注列表
   * GET /users/:id/following
   */
  @Get(':id/following')
  async getFollowing(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.followsService.getFollowing(userId, page, limit);
  }

  /**
   * 获取用户粉丝列表
   * GET /users/:id/followers
   */
  @Get(':id/followers')
  async getFollowers(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.followsService.getFollowers(userId, page, limit);
  }
}
