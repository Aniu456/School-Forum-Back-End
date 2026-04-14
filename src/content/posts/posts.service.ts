import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CacheClear, Cacheable } from '../../core/cache/cache.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RealtimeService } from '../../notifications/realtime.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeService))
    private realtimeService: RealtimeService,
  ) {}

  /**
   * 创建帖子
   */
  async create(userId: string, createPostDto: CreatePostDto) {
    // 🛡️ 检查用户是否有发帖权限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { canPost: true },
    });

    if (!user?.canPost) {
      throw new ForbiddenException('您已被禁止发帖');
    }

    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        images: createPostDto.images || [],
        tags: createPostDto.tags || [],
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    void this.realtimeService.broadcastNewPost(post.id, userId);

    return {
      ...post,
      likeCount: 0,
      commentCount: 0,
    };
  }

  /**
   * 获取帖子列表（分页、排序、筛选）
   * 🚀 已优化：修复 N+1 查询问题
   */
  @Cacheable({ keyPrefix: 'posts:list', ttl: 300 })
  async findAll(
    page: number = 1,
    limit: number = 20,
    sortBy: 'createdAt' | 'viewCount' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    tag?: string,
    authorId?: string,
  ) {
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      isHidden: false, // 过滤隐藏帖子
    };

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (authorId) {
      where.authorId = authorId;
    }

    // 获取帖子列表和总数
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          images: true,
          tags: true,
          viewCount: true,
          isPinned: true,
          pinnedAt: true,
          isHighlighted: true,
          highlightedAt: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' }, // 置顶帖子优先
          { isHighlighted: 'desc' }, // 精华次优
          { [sortBy]: order },
        ],
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    // 🚀 优化：批量获取所有帖子的点赞数（一次查询）
    const postIds = posts.map((p) => p.id);
    const likeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: postIds },
        targetType: 'POST',
      },
      _count: {
        id: true,
      },
    });

    // 创建点赞数映射表
    const likeCountMap = new Map(
      likeCounts.map((item) => [item.targetId, item._count.id]),
    );

    // 组合数据
    const postsWithCounts = posts.map((post) => ({
      ...post,
      likeCount: likeCountMap.get(post.id) || 0,
      commentCount: post._count.comments,
      _count: undefined,
    }));

    return {
      data: postsWithCounts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取精华帖子列表（按加精时间倒序）
   */
  async findHighlighted(limit = 5) {
    const posts = await this.prisma.post.findMany({
      where: {
        isHighlighted: true,
        isHidden: false,
      },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        tags: true,
        viewCount: true,
        isPinned: true,
        pinnedAt: true,
        isHighlighted: true,
        highlightedAt: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ highlightedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const postIds = posts.map((p) => p.id);
    const likeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: { targetId: { in: postIds }, targetType: 'POST' },
      _count: { id: true },
    });
    const likeCountMap = new Map(
      likeCounts.map((item) => [item.targetId, item._count.id]),
    );

    return {
      data: posts.map((post) => ({
        ...post,
        likeCount: likeCountMap.get(post.id) || 0,
        commentCount: post._count.comments,
        _count: undefined,
      })),
    };
  }

  /**
   * 获取帖子详情
   */
  @Cacheable({ keyPrefix: 'post', ttl: 600 })
  async findOne(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 隐藏的帖子不可访问
    if (post.isHidden) {
      throw new NotFoundException('帖子不存在');
    }

    // 增加浏览量
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 获取点赞数
    const likeCount = await this.prisma.like.count({
      where: {
        targetId: postId,
        targetType: 'POST',
      },
    });

    // 检查当前用户是否点赞
    let isLikedByMe = false;
    if (userId) {
      const like = await this.prisma.like.findUnique({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: postId,
            targetType: 'POST',
          },
        },
      });
      isLikedByMe = !!like;
    }

    return {
      ...post,
      likeCount,
      commentCount: post._count.comments,
      isLikedByMe,
      _count: undefined,
    };
  }

  /**
   * 更新帖子
   */
  @CacheClear({ patterns: ['posts:*', 'post:*'] })
  async update(postId: string, userId: string, updatePostDto: UpdatePostDto) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查权限：只有作者可以编辑
    if (post.authorId !== userId) {
      throw new ForbiddenException('无权限编辑此帖子');
    }

    // 更新帖子
    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // 🚀 广播更新事件
    this.realtimeService.broadcastPostUpdate(postId);

    return updatedPost;
  }

  /**
   * 删除帖子（软删除）
   */
  @CacheClear({ patterns: ['posts:*', 'post:*'] })
  async remove(postId: string, userId: string, userRole: Role) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查权限：作者或管理员可以删除
    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权限删除此帖子');
    }

    // 物理删除帖子
    await this.prisma.post.delete({
      where: { id: postId },
    });

    // 🚀 广播删除事件
    this.realtimeService.broadcastPostDelete(postId);

    return { message: '帖子删除成功' };
  }
}
