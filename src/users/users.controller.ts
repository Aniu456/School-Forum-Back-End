import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersActivityService } from './users-activity.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../core/common/decorators/current-user.decorator';
import { LikesService } from '../features/social/likes/likes.service';
import { Public } from '../core/common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersActivityService: UsersActivityService,
    @Inject(forwardRef(() => LikesService))
    private readonly likesService: LikesService,
  ) { }

  /**
   * 获取当前用户资料
   * GET /users/me
   */
  @Get('me')
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * 更新当前用户资料
   * PATCH /users/me
   */
  @Patch('me')
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  /**
   * 获取用户详情
   * GET /users/:id
   */
  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  /**
   * 获取用户发帖列表
   * GET /users/:id/posts
   */
  @Get(':id/posts')
  async getUserPosts(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getUserPosts(userId, page, limit);
  }

  /**
   * 获取用户点赞列表
   * GET /users/:id/likes
   */
  @Public()
  @Get(':id/likes')
  async getUserLikes(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getUserLikes(userId, page, limit);
  }

  @Public()
  @Get(':id/activity')
  async getUserActivity(
    @Param('id') userId: string,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersActivityService.getUserActivity(
      userId,
      type,
      page,
      limit,
    );
  }
}
