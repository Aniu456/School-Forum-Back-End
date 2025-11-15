import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Role } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建帖子
   */
  async create(userId: string, createPostDto: CreatePostDto) {
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

    return {
      ...post,
      likeCount: 0,
      commentCount: 0,
    };
  }

  /**
   * 获取帖子列表（分页、排序、筛选）
   */
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
      isDeleted: false,
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
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    // 获取每个帖子的点赞数
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const likeCount = await this.prisma.like.count({
          where: {
            targetId: post.id,
            targetType: 'POST',
          },
        });

        return {
          ...post,
          likeCount,
          commentCount: post._count.comments,
          _count: undefined,
        };
      }),
    );

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
   * 获取帖子详情
   */
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

    if (!post || post.isDeleted) {
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
  async update(postId: string, userId: string, updatePostDto: UpdatePostDto) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
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

    return updatedPost;
  }

  /**
   * 删除帖子（软删除）
   */
  async remove(postId: string, userId: string, userRole: Role) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查权限：作者或管理员可以删除
    if (post.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权限删除此帖子');
    }

    // 软删除
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: '帖子删除成功' };
  }
}
