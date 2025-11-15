import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
    @Param('id') followingId: string,
    @CurrentUser('id') userId: string,
    @Body() createFollowDto: CreateFollowDto,
  ) {
    // 覆盖 DTO 中的 followingId
    createFollowDto.followingId = followingId;
    return this.followsService.follow(userId, createFollowDto);
  }

  /**
   * 取消关注用户
   * DELETE /users/:id/follow
   */
  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('id') followingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.followsService.unfollow(userId, followingId);
  }

  /**
   * 获取用户关注列表
   * GET /users/:id/following
   */
  @Get(':id/following')
  async getFollowing(
    @Param('id') userId: string,
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
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.followsService.getFollowers(userId, page, limit);
  }
}
