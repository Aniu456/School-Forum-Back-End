import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建评论或回复
   */
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content, parentId } = createCommentDto;

    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('帖子不存在');
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.isDeleted) {
        throw new NotFoundException('父评论不存在');
      }

      // 确保父评论属于同一个帖子
      if (parentComment.postId !== postId) {
        throw new BadRequestException('父评论不属于该帖子');
      }
    }

    // 创建评论
    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        authorId: userId,
        parentId,
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

    // 获取点赞数
    const likeCount = await this.prisma.like.count({
      where: {
        targetId: comment.id,
        targetType: 'COMMENT',
      },
    });

    return {
      ...comment,
      likeCount,
    };
  }

  /**
   * 获取帖子的评论列表（分层结构）
   */
  async findByPostId(
    postId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'createdAt' | 'likeCount' = 'createdAt',
  ) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundException('帖子不存在');
    }

    const skip = (page - 1) * limit;

    // 获取一级评论（没有父评论的评论）
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
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
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: sortBy === 'createdAt' ? { createdAt: 'desc' } : undefined,
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    // 为每个一级评论获取点赞数和回复（最多显示几条）
    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        // 获取点赞数
        const likeCount = await this.prisma.like.count({
          where: {
            targetId: comment.id,
            targetType: 'COMMENT',
          },
        });

        // 如果需要按点赞数排序，则获取点赞数
        if (sortBy === 'likeCount') {
          // 这里需要在获取所有评论后再排序
        }

        // 获取前3条回复
        const replies = await this.prisma.comment.findMany({
          where: {
            parentId: comment.id,
            isDeleted: false,
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
          orderBy: {
            createdAt: 'asc',
          },
          take: 3,
        });

        // 为每条回复获取点赞数
        const repliesWithLikes = await Promise.all(
          replies.map(async (reply) => {
            const replyLikeCount = await this.prisma.like.count({
              where: {
                targetId: reply.id,
                targetType: 'COMMENT',
              },
            });
            return {
              ...reply,
              likeCount: replyLikeCount,
            };
          }),
        );

        return {
          ...comment,
          likeCount,
          replyCount: comment._count.replies,
          replies: repliesWithLikes,
          _count: undefined,
        };
      }),
    );

    // 如果按点赞数排序，在这里排序
    if (sortBy === 'likeCount') {
      commentsWithDetails.sort((a, b) => b.likeCount - a.likeCount);
    }

    return {
      data: commentsWithDetails,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 获取评论的所有回复（分页）
   */
  async findReplies(commentId: string, page: number = 1, limit: number = 20) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('评论不存在');
    }

    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          parentId: commentId,
          isDeleted: false,
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
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
      }),
    ]);

    // 为每条回复获取点赞数
    const repliesWithLikes = await Promise.all(
      replies.map(async (reply) => {
        const likeCount = await this.prisma.like.count({
          where: {
            targetId: reply.id,
            targetType: 'COMMENT',
          },
        });
        return {
          ...reply,
          likeCount,
        };
      }),
    );

    return {
      data: repliesWithLikes,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 删除评论（软删除）
   */
  async remove(commentId: string, userId: string, userRole: Role) {
    // 检查评论是否存在
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('评论不存在');
    }

    // 检查权限：作者或管理员可以删除
    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权限删除此评论');
    }

    // 软删除
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: '评论删除成功' };
  }
}
