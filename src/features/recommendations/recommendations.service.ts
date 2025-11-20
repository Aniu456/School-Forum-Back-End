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
  private readonly TOPICS_CACHE_TTL = 2 * 60 * 60; // 2 小时

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) { }

  /**
   * 计算热度分数（Wilson Score 算法）
   * 用于评估帖子的热度
   */
  private calculateHotScore(post: {
    likeCount: number;
    commentCount: number;
  }): number {
    // Wilson Score 算法（Reddit 使用）
    const upvotes = post.likeCount;
    const n = upvotes + (post.commentCount > 0 ? 5 : 0); // 评论权重为5

    if (n === 0) return 0;

    const z = 1.96; // 95% 置信度
    const p = n > 0 ? upvotes / n : 0;

    const score =
      (p +
        (z * z) / (2 * n) -
        z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n);

    return Math.max(0, score);
  }

  /**
   * 计算趋势分数（时间衰减算法）
   * 用于发现新的热门帖子
   */
  private calculateTrendingScore(post: {
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: Date;
  }): number {
    const now = Date.now();
    const postTime = new Date(post.createdAt).getTime();
    const ageInHours = (now - postTime) / (1000 * 60 * 60);

    const gravity = 1.8; // 重力系数
    const baseScore =
      post.likeCount * 2 + post.commentCount * 5 + post.viewCount * 0.1;

    return baseScore / Math.pow(ageInHours + 2, gravity);
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(post: {
    likeCount: number;
    commentCount: number;
    viewCount: number;
  }): number {
    // 基于用户互动的质量评分
    const engagementRate =
      (post.likeCount + post.commentCount) / Math.max(1, post.viewCount);
    return Math.min(100, engagementRate * 100);
  }

  /**
   * 更新帖子的所有评分
   */
  async updatePostScores(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return;

    const hotScore = this.calculateHotScore(post);
    const trendingScore = this.calculateTrendingScore(post);
    const qualityScore = this.calculateQualityScore(post);

    await this.prisma.postScore.upsert({
      where: { postId },
      create: {
        postId,
        hotScore,
        trendingScore,
        qualityScore,
      },
      update: {
        hotScore,
        trendingScore,
        qualityScore,
      },
    });
  }

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
        orderBy: {
          likeCount: 'desc',
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
        orderBy: {
          commentCount: 'desc',
        },
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
      },
    };
  }

  /**
   * 获取热门话题列表
   */
  async getHotTopics(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        where: { isHot: true },
        orderBy: { postCount: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.topic.count({ where: { isHot: true } }),
    ]);

    return {
      data: topics,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 获取所有话题列表
   */
  async getAllTopics(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [topics, total] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: { postCount: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.topic.count(),
    ]);

    return {
      data: topics,
      meta: {
        page,
        limit,
        total,
      },
    };
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

      // 清除话题缓存
      for (let page = 1; page <= 5; page++) {
        for (const limit of [10, 20, 50]) {
          keys.push(`${this.CACHE_PREFIX}topics:hot:${page}:${limit}`);
          keys.push(`${this.CACHE_PREFIX}topics:all:${page}:${limit}`);
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
