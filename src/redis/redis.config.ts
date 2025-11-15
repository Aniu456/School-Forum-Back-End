import type { RedisClientOptions } from 'redis';

/**
 * Redis 客户端配置
 */
export const redisClientOptions: RedisClientOptions = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD,
} as any;
