import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  forwardRef,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../core/common/decorators/current-user.decorator';
import { Public } from '../core/common/decorators/public.decorator';
import { LikesService } from '../features/social/likes/likes.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersActivityService } from './users-activity.service';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersActivityService: UsersActivityService,
    @Inject(forwardRef(() => LikesService))
    private readonly likesService: LikesService,
  ) {}

  /**
   * 获取当前用户资料
   * GET /users/me
   */
  @Get('me')
  @ApiOperation({ summary: '获取当前用户资料' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  /**
   * 获取当前用户的活动（别名）
   * GET /users/me/activities
   */
  @Get('me/activities')
  @ApiOperation({ summary: '获取当前用户的活动' })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: '活动类型',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMyActivity(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersActivityService.getUserActivity(userId, type, page, limit);
  }

  /**
   * 更新当前用户资料
   * PATCH /users/me
   */
  @Patch('me')
  @ApiOperation({ summary: '更新当前用户资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '用户被封禁' })
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
  @ApiOperation({ summary: '获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserById(@Param('id') userId: string) {
    return this.usersService.getUserById(userId);
  }

  /**
   * 获取用户发帖列表
   * GET /users/:id/posts
   */
  @Get(':id/posts')
  @ApiOperation({ summary: '获取用户发帖列表' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
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
  @ApiOperation({ summary: '获取用户点赞列表' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserLikes(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getUserLikes(userId, page, limit);
  }

  @Public()
  @Get(':id/activity')
  @ApiOperation({ summary: '获取用户活动' })
  @ApiParam({ name: 'id', description: '用户ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: '活动类型',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserActivity(
    @Param('id') userId: string,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersActivityService.getUserActivity(userId, type, page, limit);
  }
}
