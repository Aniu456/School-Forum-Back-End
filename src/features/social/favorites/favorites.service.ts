import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

/**
 * 收藏服务 - 简化版（无文件夹功能）
 * 
 * 注意：Folder 模型已从 schema 中移除
 * 收藏功能简化为直接收藏帖子，不再支持文件夹分类
 */
@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 收藏帖子
   */
  async addFavorite(userId: string, dto: { postId: string; note?: string }) {
    const { postId, note } = dto;

    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (post.isHidden) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查是否已经收藏过此帖子
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingFavorite) {
      throw new BadRequestException('您已经收藏过此帖子');
    }

    // 创建收藏
    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        postId,
        note,
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            authorId: true,
            createdAt: true,
          },
        },
      },
    });

    return favorite;
  }

  /**
   * 取消收藏
   */
  async removeFavorite(userId: string, favoriteId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite) {
      throw new NotFoundException('收藏记录不存在');
    }

    if (favorite.userId !== userId) {
      throw new BadRequestException('无权删除此收藏');
    }

    await this.prisma.favorite.delete({
      where: { id: favoriteId },
    });

    return { message: '取消收藏成功' };
  }

  /**
   * 通过帖子ID取消收藏
   */
  async removeFavoriteByPostId(userId: string, postId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('未收藏此帖子');
    }

    await this.prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { message: '取消收藏成功' };
  }

  /**
   * 获取用户的收藏列表
   */
  async getFavorites(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              images: true,
              tags: true,
              viewCount: true,
              likeCount: true,
              commentCount: true,
              authorId: true,
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
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      data: favorites,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 检查是否收藏了指定帖子
   */
  async isFavorited(userId: string, postId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(userId: string, postId: string, note?: string) {
    const isFav = await this.isFavorited(userId, postId);

    if (isFav) {
      await this.removeFavoriteByPostId(userId, postId);
      return { action: 'removed', isFavorited: false };
    } else {
      await this.addFavorite(userId, { postId, note });
      return { action: 'added', isFavorited: true };
    }
  }
}
