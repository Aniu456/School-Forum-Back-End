import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { CreateFolderDto, UpdateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) { }

  /**
   * 创建收藏夹
   */
  async createFolder(userId: string, createFolderDto: CreateFolderDto) {
    const folder = await this.prisma.folder.create({
      data: {
        userId,
        ...createFolderDto,
      },
    });

    return folder;
  }

  /**
   * 获取用户的收藏夹列表
   */
  async getFolders(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [folders, total] = await Promise.all([
      this.prisma.folder.findMany({
        where: { userId },
        include: {
          _count: {
            select: { favorites: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.folder.count({ where: { userId } }),
    ]);

    return {
      data: folders.map((f) => ({
        ...f,
        favoriteCount: f._count.favorites,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 获取单个收藏夹详情
   */
  async getFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (folder.userId !== userId) {
      throw new BadRequestException('无权访问此收藏夹');
    }

    return folder;
  }

  /**
   * 更新收藏夹
   */
  async updateFolder(
    userId: string,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ) {
    // 检查收藏夹权限
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (folder.userId !== userId) {
      throw new BadRequestException('无权修改此收藏夹');
    }

    const updatedFolder = await this.prisma.folder.update({
      where: { id: folderId },
      data: updateFolderDto,
    });

    return updatedFolder;
  }

  /**
   * 删除收藏夹
   */
  async deleteFolder(userId: string, folderId: string) {
    // 检查收藏夹权限
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (folder.userId !== userId) {
      throw new BadRequestException('无权删除此收藏夹');
    }

    if (folder.isDefault) {
      throw new BadRequestException('不能删除默认收藏夹');
    }

    // 删除该收藏夹中的所有收藏
    await this.prisma.favorite.deleteMany({
      where: { folderId },
    });

    // 删除收藏夹
    await this.prisma.folder.delete({
      where: { id: folderId },
    });

    return { message: '收藏夹已删除' };
  }

  /**
   * 收藏帖子
   */
  async addFavorite(userId: string, createFavoriteDto: CreateFavoriteDto) {
    const { postId, folderId, note } = createFavoriteDto;

    // 检查帖子是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    // 检查收藏夹是否存在且属于当前用户
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (folder.userId !== userId) {
      throw new BadRequestException('无权访问此收藏夹');
    }

    // 检查是否已经收藏
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
        folderId,
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
   * 获取收藏夹中的帖子列表
   */
  async getFavorites(
    userId: string,
    folderId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    // 检查收藏夹权限
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException('收藏夹不存在');
    }

    if (folder.userId !== userId) {
      throw new BadRequestException('无权访问此收藏夹');
    }

    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: {
          userId,
          folderId,
        },
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
      this.prisma.favorite.count({
        where: {
          userId,
          folderId,
        },
      }),
    ]);

    return {
      data: favorites,
      meta: {
        page,
        limit,
        total,
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
}
