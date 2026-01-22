import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { TargetType } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 点赞/取消点赞（切换）
   */
  async toggle(userId: string, toggleLikeDto: ToggleLikeDto) {
    const { targetId, targetType } = toggleLikeDto;

    // 验证目标是否存在
    await this.validateTarget(targetId, targetType);

    // 检查是否已点赞
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    let isLiked: boolean;
    let message: string;

    if (existingLike) {
      // 已点赞，取消点赞
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        // 减少点赞数（防止变成负数）
        if (targetType === TargetType.POST) {
          const post = await tx.post.findUnique({
            where: { id: targetId },
            select: { likeCount: true },
          });
          if (post && post.likeCount > 0) {
            await tx.post.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } },
            });
          }
        } else if (targetType === TargetType.COMMENT) {
          const comment = await tx.comment.findUnique({
            where: { id: targetId },
            select: { likeCount: true },
          });
          if (comment && comment.likeCount > 0) {
            await tx.comment.update({
              where: { id: targetId },
              data: { likeCount: { decrement: 1 } },
            });
          }
        }
      });
      isLiked = false;
      message = '取消点赞成功';
    } else {
      // 未点赞，添加点赞
      await this.prisma.$transaction(async (tx) => {
        await tx.like.create({
          data: {
            userId,
            targetId,
            targetType,
          },
        });

        // 增加点赞数
        if (targetType === TargetType.POST) {
          await tx.post.update({
            where: { id: targetId },
            data: { likeCount: { increment: 1 } },
          });
        } else if (targetType === TargetType.COMMENT) {
          await tx.comment.update({
            where: { id: targetId },
            data: { likeCount: { increment: 1 } },
          });
        }
      });

      // 🚀 广播点赞事件
      this.notificationsService.broadcastLike({
        postId: targetType === TargetType.POST ? targetId : undefined,
        commentId: targetType === TargetType.COMMENT ? targetId : undefined,
        userId,
      });

      isLiked = true;
      message = '点赞成功';

      // 发送点赞通知
      try {
        const target =
          targetType === TargetType.POST
            ? await this.prisma.post.findUnique({
                where: { id: targetId },
                select: { authorId: true, title: true },
              })
            : await this.prisma.comment.findUnique({
                where: { id: targetId },
                select: { authorId: true, content: true },
              });

        if (target && target.authorId !== userId) {
          await this.notificationsService.create({
            userId: target.authorId,
            type: 'LIKE',
            senderId: userId,
            content:
              targetType === TargetType.POST
                ? `赞了你的帖子: ${(target as any).title?.substring(0, 30)}...`
                : `赞了你的评论: ${(target as any).content?.substring(0, 30)}...`,
            relatedId: targetId,
          });
        }
      } catch (error) {
        console.error('Failed to send like notification:', error);
      }
    }

    // 获取最新的点赞数
    const likeCount = await this.prisma.like.count({
      where: {
        targetId,
        targetType,
      },
    });

    return {
      message,
      data: {
        isLiked,
        likeCount,
      },
    };
  }

  /**
   * 获取用户的点赞列表（优化：批量查询避免N+1问题）
   */
  async getUserLikes(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.like.count({
        where: {
          userId,
        },
      }),
    ]);

    // 分离帖子和评论的ID
    const postIds = likes
      .filter((like) => like.targetType === TargetType.POST)
      .map((like) => like.targetId);

    const commentIds = likes
      .filter((like) => like.targetType === TargetType.COMMENT)
      .map((like) => like.targetId);

    // 批量查询帖子和评论
    const [posts, comments] = await Promise.all([
      // 批量查询帖子
      postIds.length > 0
        ? this.prisma.post.findMany({
            where: {
              id: { in: postIds },
            },
            select: {
              id: true,
              title: true,
              content: true,
              images: true,
              viewCount: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          })
        : Promise.resolve([]),

      // 批量查询评论
      commentIds.length > 0
        ? this.prisma.comment.findMany({
            where: {
              id: { in: commentIds },
            },
            select: {
              id: true,
              content: true,
              postId: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    // 创建Map以便快速查找
    const postMap = new Map(
      posts.map((post) => [post.id, post] as [string, any]),
    );
    const commentMap = new Map(
      comments.map((comment) => [comment.id, comment] as [string, any]),
    );

    // 组合结果
    const likesWithDetails = likes.map((like) => {
      if (like.targetType === TargetType.POST) {
        return {
          ...like,
          target: postMap.get(like.targetId),
        };
      } else {
        return {
          ...like,
          target: commentMap.get(like.targetId),
        };
      }
    });

    return {
      data: likesWithDetails,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 验证目标是否存在
   * 优化：使用单个查询检查
   */
  private async validateTarget(targetId: string, targetType: TargetType) {
    if (targetType === TargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true, authorId: true, title: true },
      });

      if (!post) {
        throw new NotFoundException('帖子不存在');
      }

      return post;
    } else if (targetType === TargetType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
        select: { id: true, authorId: true, content: true },
      });

      if (!comment) {
        throw new NotFoundException('评论不存在');
      }

      return comment;
    } else {
      throw new BadRequestException('无效的目标类型');
    }
  }
}
