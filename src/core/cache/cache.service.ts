import { Injectable } from '@nestjs/common';
import { createLogger } from '../logger';
import { RedisService } from '../redis/redis.service';

/**
 * 缓存服务
 * 提供高级缓存操作功能
 */
@Injectable()
export class CacheService {
  private readonly logger = createLogger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * 获取或设置缓存
   * 如果缓存不存在，执行工厂函数获取值并缓存
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // 尝试从缓存获取
      const cached = await this.redis.get<T>(key);
      if (cached !== null) {
        this.logger.debug(`Cache hit: ${key}`);
        return cached;
      }

      // 缓存未命中，执行工厂函数
      this.logger.debug(`Cache miss: ${key}`);
      const value = await factory();

      // 缓存结果
      if (value !== null && value !== undefined) {
        const defaultTtl = parseInt(process.env.CACHE_TTL || '300');
        await this.redis.set(key, value, ttl || defaultTtl);
        this.logger.debug(`Cache set: ${key} (TTL: ${ttl || defaultTtl}s)`);
      }

      return value;
    } catch (error) {
      this.logger.error(`Cache getOrSet error: ${key}`, error?.toString());
      // 缓存出错时，仍返回工厂函数的结果
      return factory();
    }
  }

  /**
   * 批量获取缓存
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    try {
      // 使用 mget 批量获取（Redis支持）
      const client = this.redis.getClient();
      const values = await client.mGet(keys);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];
        if (value !== null) {
          result.set(key, JSON.parse(value));
        }
      }

      this.logger.debug(`Cache mget: ${result.size}/${keys.length} hits`);
    } catch (error) {
      this.logger.error('Cache getMany error', error?.toString());
    }

    return result;
  }

  /**
   * 批量设置缓存
   */
  async setMany<T>(
    items: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<void> {
    try {
      const defaultTtl = parseInt(process.env.CACHE_TTL || '300');

      for (const item of items) {
        await this.redis.set(item.key, item.value, item.ttl || defaultTtl);
      }

      this.logger.debug(`Cache mset: ${items.length} keys`);
    } catch (error) {
      this.logger.error('Cache setMany error', error?.toString());
    }
  }

  /**
   * 删除匹配模式的所有缓存键
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = this.redis.getClient();
      const keys: string[] = [];
      let cursor = 0;

      do {
        const reply = await client.scan(cursor.toString(), {
          MATCH: pattern,
          COUNT: 100,
        });
        cursor = Number(reply.cursor);
        keys.push(...reply.keys);
      } while (cursor !== 0);

      if (keys.length > 0) {
        const deleted = await this.redis.mDel(keys);
        this.logger.debug(`Cache deleted pattern ${pattern}: ${deleted} keys`);
        return deleted;
      }

      return 0;
    } catch (error) {
      this.logger.error(
        `Cache deletePattern error: ${pattern}`,
        error?.toString(),
      );
      return 0;
    }
  }

  /**
   * 缓存帖子数据
   */
  async cachePost(postId: string, post: any, ttl?: number): Promise<void> {
    const key = `post:${postId}`;
    const defaultTtl = parseInt(process.env.CACHE_POST_TTL || '600');
    await this.redis.set(key, post, ttl || defaultTtl);
    this.logger.debug(`Cached post: ${postId}`);
  }

  /**
   * 获取缓存的帖子
   */
  async getCachedPost(postId: string): Promise<any | null> {
    const key = `post:${postId}`;
    return this.redis.get(key);
  }

  /**
   * 删除帖子缓存
   */
  async deletePostCache(postId: string): Promise<void> {
    const key = `post:${postId}`;
    await this.redis.del(key);
    this.logger.debug(`Deleted post cache: ${postId}`);

    // 同时清除相关缓存
    await this.deletePattern('posts:*');
    await this.deletePattern('posts:infinite*');
  }

  /**
   * 缓存用户数据
   */
  async cacheUser(userId: string, user: any, ttl?: number): Promise<void> {
    const key = `user:${userId}`;
    const defaultTtl = parseInt(process.env.CACHE_USER_TTL || '1800');
    await this.redis.set(key, user, ttl || defaultTtl);
    this.logger.debug(`Cached user: ${userId}`);
  }

  /**
   * 获取缓存的用户
   */
  async getCachedUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return this.redis.get(key);
  }

  /**
   * 删除用户缓存
   */
  async deleteUserCache(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.redis.del(key);
    this.logger.debug(`Deleted user cache: ${userId}`);

    // 同时清除相关缓存
    await this.deletePattern('users:*');
    await this.deletePattern(`user:${userId}:*`);
  }

  /**
   * 缓存热门帖子列表
   */
  async cacheHotPosts(posts: any[], ttl?: number): Promise<void> {
    const key = 'posts:hot';
    const defaultTtl = parseInt(process.env.CACHE_HOT_POST_TTL || '300');
    await this.redis.set(key, posts, ttl || defaultTtl);
    this.logger.debug('Cached hot posts');
  }

  /**
   * 获取缓存的热门帖子
   */
  async getCachedHotPosts(): Promise<any[] | null> {
    const key = 'posts:hot';
    return this.redis.get(key);
  }

  /**
   * 缓存趋势帖子列表
   */
  async cacheTrendingPosts(posts: any[], ttl?: number): Promise<void> {
    const key = 'posts:trending';
    const defaultTtl = parseInt(process.env.CACHE_TTL || '300');
    await this.redis.set(key, posts, ttl || defaultTtl);
    this.logger.debug('Cached trending posts');
  }

  /**
   * 获取缓存的趋势帖子
   */
  async getCachedTrendingPosts(): Promise<any[] | null> {
    const key = 'posts:trending';
    return this.redis.get(key);
  }

  /**
   * 增加缓存计数器
   */
  async incrementCounter(
    key: string,
    delta: number = 1,
    ttl?: number,
  ): Promise<number> {
    const newValue = await this.redis.increment(key, delta);

    // 如果是新建计数器，设置过期时间
    const currentTtl = await this.redis.ttl(key);
    if (currentTtl === -1 && ttl) {
      await this.redis.expire(key, ttl);
    }

    return newValue;
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    try {
      const client = this.redis.getClient();
      const info = await client.info('memory');
      const dbSize = await client.dbSize();

      // 解析内存使用
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        totalKeys: dbSize,
        memoryUsage,
        hitRate: 0, // TODO: 实现命中率统计
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats', error?.toString());
      return {
        totalKeys: 0,
        memoryUsage: 'unknown',
        hitRate: 0,
      };
    }
  }

  /**
   * 清空所有缓存
   */
  async flushAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush all cache in production!');
    }

    await this.redis.flushAll();
    this.logger.warn('All cache flushed');
  }
}
