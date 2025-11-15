import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleLikeDto } from './dto/toggle-like.dto';
import { TargetType } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

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
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      isLiked = false;
      message = '取消点赞成功';
    } else {
      // 未点赞，添加点赞
      await this.prisma.like.create({
        data: {
          userId,
          targetId,
          targetType,
        },
      });
      isLiked = true;
      message = '点赞成功';
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
   * 获取用户的点赞列表
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

    // 获取点赞目标的详细信息
    const likesWithDetails = await Promise.all(
      likes.map(async (like) => {
        if (like.targetType === TargetType.POST) {
          const post = await this.prisma.post.findUnique({
            where: { id: like.targetId },
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
          });
          return {
            ...like,
            target: post,
          };
        } else {
          const comment = await this.prisma.comment.findUnique({
            where: { id: like.targetId },
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
          });
          return {
            ...like,
            target: comment,
          };
        }
      }),
    );

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
   */
  private async validateTarget(targetId: string, targetType: TargetType) {
    if (targetType === TargetType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });

      if (!post || post.isDeleted) {
        throw new NotFoundException('帖子不存在');
      }
    } else if (targetType === TargetType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
      });

      if (!comment || comment.isDeleted) {
        throw new NotFoundException('评论不存在');
      }
    } else {
      throw new BadRequestException('无效的目标类型');
    }
  }
}
