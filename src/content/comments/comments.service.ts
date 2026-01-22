import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Role } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 创建评论或回复
   */
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content, parentId } = createCommentDto;

    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 隐藏的帖子不可评论
    if (post.isHidden) {
      throw new NotFoundException('帖子不存在');
    }

    // 锁定的帖子不可评论
    if (post.isLocked) {
      throw new BadRequestException('该帖子已锁定，禁止评论');
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      // 确保父评论属于同一个帖子
      if (parentComment.postId !== postId) {
        throw new BadRequestException('父评论不属于该帖子');
      }
    }

    // 创建评论并更新帖子评论数
    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
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

      // 增加帖子评论数
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    // 获取点赞数
    const likeCount = await this.prisma.like.count({
      where: {
        targetId: comment.id,
        targetType: 'COMMENT',
      },
    });

    // 发送通知
    try {
      if (parentId) {
        // 回复评论：通知父评论作者
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: parentId },
        });
        if (parentComment && parentComment.authorId !== userId) {
          await this.notificationsService.create({
            userId: parentComment.authorId,
            type: 'REPLY',
            senderId: userId,
            content: `回复了你的评论: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            relatedId: comment.id,
          });
        }
      } else {
        // 评论帖子：通知帖子作者
        if (post.authorId !== userId) {
          await this.notificationsService.create({
            userId: post.authorId,
            type: 'COMMENT',
            senderId: userId,
            content: `评论了你的帖子: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            relatedId: comment.id,
          });
        }
      }
    } catch (error) {
      // 通知发送失败不影响评论创建
      console.error('Failed to send comment notification:', error);
    }

    // 🚀 广播事件 (实时更新)
    const broadcastPayload = {
      postId,
      commentId: comment.id,
      parentId,
      author: comment.author,
      content,
      createdAt: comment.createdAt,
    };

    if (parentId) {
      this.notificationsService.broadcastReply(broadcastPayload);
    } else {
      this.notificationsService.broadcastComment(broadcastPayload);
    }

    return {
      ...comment,
      likeCount,
    };
  }

  /**
   * 获取帖子的评论列表（分层结构）
   * 🚀 已优化：修复 N+1 查询问题
   */
  async findByPostId(
    postId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'createdAt' | 'likeCount' = 'createdAt',
    previewLimit: number = 3,
  ) {
    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 隐藏的帖子不可访问评论
    if (post.isHidden) {
      throw new NotFoundException('帖子不存在');
    }

    const skip = (page - 1) * limit;

    // 获取一级评论（没有父评论的评论）
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
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
        },
      }),
    ]);

    // 🚀 优化：批量获取评论ID
    const commentIds = comments.map((c) => c.id);

    // 🚀 优化：一次性获取所有一级评论的点赞数
    const commentLikeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: commentIds },
        targetType: 'COMMENT',
      },
      _count: {
        id: true,
      },
    });

    const commentLikeCountMap = new Map(
      commentLikeCounts.map((item) => [item.targetId, item._count.id]),
    );

    // 🚀 优化：一次性获取所有回复（前3条）
    const allReplies = await this.prisma.comment.findMany({
      where: {
        parentId: { in: commentIds },
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
      // 注意：这里获取所有回复，然后在内存中分组和截取
    });

    // 🚀 优化：获取所有回复的点赞数
    const replyIds = allReplies.map((r) => r.id);
    const replyLikeCounts = await this.prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: replyIds },
        targetType: 'COMMENT',
      },
      _count: {
        id: true,
      },
    });

    const replyLikeCountMap = new Map(
      replyLikeCounts.map((item) => [item.targetId, item._count.id]),
    );

    // 按父评论ID分组回复
    const repliesByParentId = new Map<string, any[]>();
    allReplies.forEach((reply) => {
      if (!repliesByParentId.has(reply.parentId!)) {
        repliesByParentId.set(reply.parentId!, []);
      }
      repliesByParentId.get(reply.parentId!)!.push({
        ...reply,
        likeCount: replyLikeCountMap.get(reply.id) || 0,
      });
    });

    // 组合数据
    const commentsWithDetails = comments.map((comment) => {
      const replies = repliesByParentId.get(comment.id) || [];
      const replyCount = comment._count.replies;
      return {
        ...comment,
        likeCount: commentLikeCountMap.get(comment.id) || 0,
        replyCount,
        hasMoreReplies: replyCount > previewLimit,
        replies: replies.slice(0, previewLimit), // 只取前 previewLimit 条
        _count: undefined,
      };
    });

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

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const skip = (page - 1) * limit;

    // 直接从 Comment 取 likeCount，避免 N+1 查询
    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          parentId: commentId,
        },
        select: {
          id: true,
          content: true,
          postId: true,
          parentId: true,
          likeCount: true,
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
        },
      }),
    ]);

    return {
      data: replies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查权限：作者或管理员可以删除
    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权限删除此评论');
    }

    // 物理删除评论
    await this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({
        where: { id: commentId },
      });

      // 减少帖子评论数（防止变成负数）
      const post = await tx.post.findUnique({
        where: { id: comment.postId },
        select: { commentCount: true },
      });
      if (post && post.commentCount > 0) {
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        });
      }
    });

    return {
      message: '评论删除成功',
    };
  }
}
