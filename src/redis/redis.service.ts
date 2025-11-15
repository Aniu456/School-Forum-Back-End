import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { redisClientOptions } from './redis.config';

/**
 * Redis 服务
 * 提供通用的 Redis 操作方法
 */
@Injectable()
export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  /**
   * 初始化 Redis 连接
   */
  async onModuleInit() {
    try {
      this.client = createClient(redisClientOptions) as RedisClientType;

      this.client.on('error', (err) => {
        console.error('Redis 连接错误:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis 已连接');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 模块销毁时关闭连接
   */
  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log('Redis 连接已关闭');
    }
  }

  /**
   * 获取值
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis get 错误 (${key}):`, error);
      return null;
    }
  }

  /**
   * 设置值
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const options = ttl ? { EX: ttl } : undefined;
      await this.client.set(key, JSON.stringify(value), options);
    } catch (error) {
      console.error(`Redis set 错误 (${key}):`, error);
    }
  }

  /**
   * 设置值（带过期时间，单位秒）
   */
  async setex(key: string, ttl: number, value: any): Promise<void> {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Redis setex 错误 (${key}):`, error);
    }
  }

  /**
   * 删除值
   */
  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error(`Redis del 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 批量删除值
   */
  async mDel(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    try {
      return await this.client.del(keys);
    } catch (error) {
      console.error('Redis mDel 错误:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists 错误 (${key}):`, error);
      return false;
    }
  }

  /**
   * 获取过期时间（秒），-1 表示永不过期，-2 表示不存在
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis ttl 错误 (${key}):`, error);
      return -2;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`Redis expire 错误 (${key}):`, error);
      return false;
    }
  }

  /**
   * 自增
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    try {
      return await this.client.incrBy(key, delta);
    } catch (error) {
      console.error(`Redis increment 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 自减
   */
  async decrement(key: string, delta: number = 1): Promise<number> {
    try {
      return await this.client.decrBy(key, delta);
    } catch (error) {
      console.error(`Redis decrement 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 列表操作：推送值到列表尾部
   */
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const stringValues = values.map(v => typeof v === 'string' ? v : JSON.stringify(v));
      return await this.client.lPush(key, stringValues);
    } catch (error) {
      console.error(`Redis lpush 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 列表操作：弹出列表头部值
   */
  async lpop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.lPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis lpop 错误 (${key}):`, error);
      return null;
    }
  }

  /**
   * 列表操作：获取列表长度
   */
  async llen(key: string): Promise<number> {
    try {
      return await this.client.lLen(key);
    } catch (error) {
      console.error(`Redis llen 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 有序集合：添加成员
   */
  async zadd(key: string, member: string, score: number): Promise<number> {
    try {
      return await (this.client as any).zAdd(key, { member, score });
    } catch (error) {
      console.error(`Redis zadd 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 有序集合：获取排行
   */
  async zrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    try {
      return await this.client.zRange(key, start, stop, { REV: true });
    } catch (error) {
      console.error(`Redis zrange 错误 (${key}):`, error);
      return [];
    }
  }

  /**
   * 有序集合：获取成员分数
   */
  async zscore(key: string, member: string): Promise<number | null> {
    try {
      return await this.client.zScore(key, member);
    } catch (error) {
      console.error(`Redis zscore 错误 (${key}):`, error);
      return null;
    }
  }

  /**
   * 有序集合：删除成员
   */
  async zrem(key: string, member: string): Promise<number> {
    try {
      return await this.client.zRem(key, member);
    } catch (error) {
      console.error(`Redis zrem 错误 (${key}):`, error);
      return 0;
    }
  }

  /**
   * 获取原始 Redis 客户端
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * 清空所有 Redis 数据（仅开发环境）
   */
  async flushAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot flush all in production!');
    }
    try {
      await this.client.flushAll();
      console.log('Redis 已清空所有数据');
    } catch (error) {
      console.error('Redis flushAll 错误:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis 健康检查失败:', error);
      return false;
    }
  }
}
