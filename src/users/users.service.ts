import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  /**
   * 获取当前用户的完整资料
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 更新用户资料
   */
  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.isBanned) {
      throw new ForbiddenException('用户已被封禁');
    }

    // 更新用户资料
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * 获取用户公开信息（包含统计数据）
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            // 扩展功能：粉丝和关注数
            // followers: true,
            // following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 构建响应数据
    const { _count, ...userInfo } = user;
    return {
      ...userInfo,
      stats: {
        postCount: _count.posts,
        followerCount: 0, // 后续扩展功能
        followingCount: 0, // 后续扩展功能
      },
    };
  }

  /**
   * 获取用户发帖列表
   */
  async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const skip = (page - 1) * limit;

    // 获取用户的帖子列表
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
          content: true,
          images: true,
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
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          authorId: userId,
        },
      }),
    ]);

    return {
      data: posts.map((post) => ({
        ...post,
        commentCount: post._count.comments,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: string) {
    const stats = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException('用户不存在');
    }

    return {
      postCount: stats._count.posts,
      commentCount: stats._count.comments,
      likeCount: stats._count.likes,
    };
  }
}
