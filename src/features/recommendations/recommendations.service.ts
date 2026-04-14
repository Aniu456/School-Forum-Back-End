import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class RecommendationsService {
  // 缓存键前缀和过期时间
  private readonly CACHE_PREFIX = 'recommendations:';
  private readonly HOT_POSTS_CACHE_TTL = 60 * 60; // 1 小时
  private readonly TRENDING_POSTS_CACHE_TTL = 30 * 60; // 30 分钟
  private readonly LATEST_POSTS_CACHE_TTL = 10 * 60; // 10 分钟

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * 获取热门帖子列表
   * 使用 Redis 缓存 1 小时
   */
  async getHotPosts(page: number = 1, limit: number = 20) {
    const cacheKey = `${this.CACHE_PREFIX}hot:${page}:${limit}`;

    // 尝试从缓存读取
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isHidden: false },
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
        orderBy: [
          { isHighlighted: 'desc' }, // 精华帖子置顶
          { likeCount: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where: { isHidden: false } }),
    ]);

    const result = {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存结果
    await this.redis.setex(cacheKey, this.HOT_POSTS_CACHE_TTL, result);

    return result;
  }

  /**
   * 获取趋势帖子列表（新晋热门）
   * 使用 Redis 缓存 30 分钟
   */
  async getTrendingPosts(page: number = 1, limit: number = 20) {
    const cacheKey = `${this.CACHE_PREFIX}trending:${page}:${limit}`;

    // 尝试从缓存读取
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    // 获取最近7天的帖子
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          isHidden: false,
          createdAt: { gte: sevenDaysAgo },
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
        orderBy: [
          { isHighlighted: 'desc' }, // 精华帖子置顶
          { commentCount: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          isHidden: false,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const result = {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存结果
    await this.redis.setex(cacheKey, this.TRENDING_POSTS_CACHE_TTL, result);

    return result;
  }

  /**
   * 获取最新帖子列表
   * 使用 Redis 缓存 10 分钟
   */
  async getLatestPosts(page: number = 1, limit: number = 20) {
    const cacheKey = `${this.CACHE_PREFIX}latest:${page}:${limit}`;

    // 尝试从缓存读取
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isHidden: false },
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
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where: { isHidden: false } }),
    ]);

    const result = {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存结果
    await this.redis.setex(cacheKey, this.LATEST_POSTS_CACHE_TTL, result);

    return result;
  }

  /**
   * 获取个性化推荐（基于用户行为）
   * 推荐用户关注的人发布的帖子
   */
  async getPersonalizedRecommendations(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    // 1. 获取用户关注的用户 ID
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // 如果没有关注任何人，返回热门帖子
    if (followingIds.length === 0) {
      return this.getHotPosts(page, limit);
    }

    // 2. 获取关注用户发布的帖子
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          isHidden: false,
          authorId: { in: followingIds },
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
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          isHidden: false,
          authorId: { in: followingIds },
        },
      }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取热门话题/标签列表
   * 基于帖子标签统计
   */
  async getHotTopics(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // 使用 Prisma 的 findMany 获取帖子标签，然后在内存中聚合
    // 注意：对于大数据量场景，应使用原生 SQL
    const recentPosts = await this.prisma.post.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 最近30天
      },
      select: { tags: true },
    });

    // 统计标签频率
    const tagCount: Record<string, number> = {};
    recentPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // 排序并分页
    const sortedTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count, isHot: count >= 5 }));

    const total = sortedTags.length;
    const data = sortedTags.slice(skip, skip + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取所有话题/标签列表
   */
  async getAllTopics(page: number = 1, limit: number = 20) {
    return this.getHotTopics(page, limit);
  }

  /**
   * 清除所有推荐缓存
   * 当有新的帖子、点赞、评论时调用
   */
  async invalidateCache(): Promise<void> {
    try {
      // 删除所有推荐相关的缓存键
      const keys: string[] = [];

      // 清除热门/趋势/最新帖子缓存
      for (let page = 1; page <= 10; page++) {
        for (const limit of [10, 20, 50]) {
          keys.push(`${this.CACHE_PREFIX}hot:${page}:${limit}`);
          keys.push(`${this.CACHE_PREFIX}trending:${page}:${limit}`);
          keys.push(`${this.CACHE_PREFIX}latest:${page}:${limit}`);
        }
      }

      if (keys.length > 0) {
        await this.redis.mDel(keys);
      }
    } catch (error) {
      console.error('清除推荐缓存失败:', error);
    }
  }
}
