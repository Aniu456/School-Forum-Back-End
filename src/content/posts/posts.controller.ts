import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';
import { Public } from '../../core/common/decorators/public.decorator';
import { CommentsService } from '../comments/comments.service';
import { SERVICE_CENTER_CATEGORIES } from '../../common/constants/tags';

interface AuthUser {
  id: string;
  role: string;
}

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService,
  ) { }

  /**
   * 创建帖子
   * POST /posts
   */
  @Post()
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
   * 获取帖子详情
   * GET /posts/:id
   */
  @Public()
  @Get(':id')
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
  async getPostComments(
    @Param('id') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt'))
    sortBy: 'createdAt' | 'likeCount',
  ) {
    return this.commentsService.findByPostId(postId, page, limit, sortBy);
  }

  /**
   * 更新帖子
   * PATCH /posts/:id
   */
  @Patch(':id')
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
  async remove(@Param('id') postId: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(postId, user.id, user.role as any);
  }

  /**
   * 获取服务中心分类列表
   * GET /posts/service-center/categories
   */
  @Public()
  @Get('service-center/categories')
  async getServiceCenterCategories() {
    return {
      data: SERVICE_CENTER_CATEGORIES,
      message: '获取服务中心分类成功',
    };
  }
}
