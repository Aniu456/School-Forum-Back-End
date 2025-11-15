import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowDto } from './dto/create-follow.dto';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 关注用户
   */
  async follow(userId: string, createFollowDto: CreateFollowDto) {
    const { followingId } = createFollowDto;

    // 不能关注自己
    if (userId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    // 检查被关注用户是否存在
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已经关注
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('您已经关注过此用户');
    }

    // 创建关注关系
    await this.prisma.follow.create({
      data: {
        followerId: userId,
        followingId,
      },
    });

    // 更新关注数和粉丝数
    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          followingCount: {
            increment: 1,
          },
        } as any,
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: {
          followerCount: {
            increment: 1,
          },
        } as any,
      }),
    ]);

    return {
      message: '关注成功',
      followingId,
    };
  }

  /**
   * 取消关注用户
   */
  async unfollow(userId: string, followingId: string) {
    // 检查关注关系是否存在
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('还未关注此用户');
    }

    // 删除关注关系
    await this.prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });

    // 更新关注数和粉丝数
    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          followingCount: {
            decrement: 1,
          },
        } as any,
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: {
          followerCount: {
            decrement: 1,
          },
        } as any,
      }),
    ]);

    return {
      message: '已取消关注',
      followingId,
    };
  }

  /**
   * 获取用户关注列表
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              bio: true,
              role: true,
              followerCount: true,
              followingCount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: {
          followerId: userId,
        },
      }),
    ]);

    return {
      data: follows.map((f) => f.following),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 获取用户粉丝列表
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              bio: true,
              role: true,
              followerCount: true,
              followingCount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
    ]);

    return {
      data: follows.map((f) => f.follower),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 检查是否关注了指定用户
   */
  async isFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    return !!follow;
  }
}
