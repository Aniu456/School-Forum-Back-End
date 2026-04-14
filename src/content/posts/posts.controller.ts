import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { Role } from '@prisma/client';
import { SERVICE_CENTER_CATEGORIES } from '../../common/constants/tags';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';
import { Public } from '../../core/common/decorators/public.decorator';
import { CommentsService } from '../comments/comments.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

interface AuthUser {
  id: string;
  role: Role;
}

@Controller('posts')
@ApiTags('posts')
@ApiBearerAuth('JWT-auth')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService,
  ) {}

  /**
   * 获取服务中心分类列表
   * GET /posts/service-center/categories
   *
   * 注意：此路由必须放在 :id 路由之前，否则会被 :id 匹配
   */
  @Public()
  @Get('service-center/categories')
  @ApiOperation({ summary: '获取服务中心分类列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getServiceCenterCategories() {
    return {
      data: SERVICE_CENTER_CATEGORIES,
      message: '获取服务中心分类成功',
    };
  }

  /**
   * 创建帖子
   * POST /posts
   */
  @Post()
  @ApiOperation({ summary: '创建帖子' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(userId, createPostDto);
  }

  /**
   * 获取帖子列表
   * GET /posts
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '获取帖子列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'viewCount'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({ name: 'tag', required: false, type: String, example: '技术' })
  @ApiQuery({ name: 'authorId', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt'))
    sortBy: 'createdAt' | 'viewCount',
    @Query('order', new DefaultValuePipe('desc')) order: 'asc' | 'desc',
    @Query('tag') tag?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.postsService.findAll(page, limit, sortBy, order, tag, authorId);
  }

  /**
   * 获取精华帖子列表
   * GET /posts/highlighted?limit=5
   * 注意：必须放在 :id 路由之前
   */
  @Public()
  @Get('highlighted')
  @ApiOperation({ summary: '获取精华帖子列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findHighlighted(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findHighlighted(limit);
  }

  /**
   * 获取帖子详情
   * GET /posts/:id
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '获取帖子详情' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '帖子不存在' })
  async findOne(
    @Param('id') postId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.postsService.findOne(postId, userId);
  }

  /**
   * 获取帖子评论列表
   * GET /posts/:id/comments
   */
  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: '获取帖子评论列表' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'likeCount'],
    example: 'createdAt',
  })
  @ApiQuery({ name: 'previewLimit', required: false, type: Number, example: 3 })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPostComments(
    @Param('id') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt'))
    sortBy: 'createdAt' | 'likeCount',
    @Query('previewLimit', new DefaultValuePipe(3), ParseIntPipe)
    previewLimit: number,
  ) {
    return this.commentsService.findByPostId(
      postId,
      page,
      limit,
      sortBy,
      previewLimit,
    );
  }

  /**
   * 更新帖子
   * PATCH /posts/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新帖子' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '帖子不存在' })
  async update(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(postId, userId, updatePostDto);
  }

  /**
   * 删除帖子
   * DELETE /posts/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除帖子' })
  @ApiParam({ name: 'id', description: '帖子ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '帖子不存在' })
  async remove(@Param('id') postId: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(postId, user.id, user.role);
  }
}
