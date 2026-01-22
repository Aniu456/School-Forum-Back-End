import { winstonLogger } from '../logger';
import { RedisService } from '../redis/redis.service';

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  /**
   * 缓存键前缀
   * 如果不指定，将使用 类名:方法名 作为前缀
   */
  keyPrefix?: string;

  /**
   * 缓存过期时间（秒）
   * 如果不指定，将使用环境变量配置的默认值
   */
  ttl?: number;

  /**
   * 是否根据方法参数生成缓存键
   * 默认为 true
   */
  dynamicKey?: boolean;

  /**
   * 条件函数，返回 true 才缓存
   */
  condition?: (...args: any[]) => boolean;

  /**
   * 除非条件函数，返回 true 才不缓存
   */
  unless?: (...args: any[]) => boolean;
}

/**
 * 默认缓存TTL配置（从环境变量读取）
 */
const DEFAULT_TTL = {
  post: parseInt(process.env.CACHE_POST_TTL || '600'), // 10分钟
  user: parseInt(process.env.CACHE_USER_TTL || '1800'), // 30分钟
  hot: parseInt(process.env.CACHE_HOT_POST_TTL || '300'), // 5分钟
  default: parseInt(process.env.CACHE_TTL || '300'), // 5分钟
};

/**
 * 缓存装饰器工厂
 * 用于缓存方法的返回值
 *
 * @example
 * ```typescript
 * @Cacheable({ keyPrefix: 'post', ttl: 600 })
 * async getPost(id: string) {
 *   return this.prisma.post.findUnique({ where: { id } });
 * }
 * ```
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    // 默认配置
    const keyPrefix = options.keyPrefix || `${className}:${propertyKey}`;
    const ttl = options.ttl || DEFAULT_TTL.default;
    const dynamicKey = options.dynamicKey !== false;

    descriptor.value = async function (...args: any[]) {
      // 检查是否启用缓存（环境变量控制）
      if (process.env.CACHE_ENABLED === 'false') {
        return originalMethod.apply(this, args);
      }

      // 检查条件
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // 检查unless条件
      if (options.unless && options.unless(...args)) {
        return originalMethod.apply(this, args);
      }

      // 生成缓存键
      const cacheKey = dynamicKey
        ? `${keyPrefix}:${generateKeyFromArgs(args)}`
        : keyPrefix;

      const redisService = this.redisService || this.redis;
      if (!redisService || typeof redisService.get !== 'function') {
        winstonLogger.warn('RedisService not found, cache decorator disabled', {
          class: className,
          method: propertyKey,
        });
        return originalMethod.apply(this, args);
      }

      try {
        // 尝试从缓存获取
        const cached = await (redisService as RedisService).get(cacheKey);
        if (cached !== null) {
          winstonLogger.debug(`Cache hit: ${cacheKey}`);
          return cached;
        }

        // 缓存未命中，执行原方法
        winstonLogger.debug(`Cache miss: ${cacheKey}`);
        const result = await originalMethod.apply(this, args);

        // 缓存结果
        if (result !== null && result !== undefined) {
          await (redisService as RedisService).set(cacheKey, result, ttl);
          winstonLogger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
        }

        return result;
      } catch (error) {
        winstonLogger.error(`Cache error: ${cacheKey}`, error?.toString());
        // 缓存出错时，仍执行原方法
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * 缓存清除装饰器
 * 用于在方法执行后清除相关缓存
 *
 * @example
 * ```typescript
 * @CacheClear({ keyPrefix: 'post', pattern: 'post:*' })
 * async updatePost(id: string, data: UpdatePostDto) {
 *   return this.prisma.post.update({ where: { id }, data });
 * }
 * ```
 */
export function CacheClear(
  options: {
    /**
     * 要清除的缓存键模式
     * 支持通配符 *（需要Redis SCAN命令支持）
     */
    patterns?: string[];

    /**
     * 要清除的缓存键前缀
     * 将根据方法参数生成完整键
     */
    keys?: string[];

    /**
     * 是否根据方法参数生成键
     */
    dynamicKey?: boolean;
  } = {},
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // 如果禁用缓存，直接返回
      if (process.env.CACHE_ENABLED === 'false') {
        return result;
      }

      const redisService = this.redisService || this.redis;
      if (!redisService) {
        return result;
      }

      try {
        // 清除指定模式的缓存
        if (options.patterns && options.patterns.length > 0) {
          for (const pattern of options.patterns) {
            await clearCacheByPattern(redisService as RedisService, pattern);
            winstonLogger.debug(`Cache cleared by pattern: ${pattern}`);
          }
        }

        // 清除指定前缀的缓存
        if (options.keys && options.keys.length > 0) {
          for (const key of options.keys) {
            const cacheKey =
              options.dynamicKey !== false
                ? `${key}:${generateKeyFromArgs(args)}`
                : key;
            await (redisService as RedisService).del(cacheKey);
            winstonLogger.debug(`Cache cleared: ${cacheKey}`);
          }
        }
      } catch (error) {
        winstonLogger.error(`Cache clear error`, error?.toString());
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * 从方法参数生成缓存键
 */
function generateKeyFromArgs(args: any[]): string {
  return args
    .map((arg) => {
      if (arg === null || arg === undefined) {
        return 'nil';
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(':');
}

/**
 * 根据模式清除缓存
 * 注意：这需要Redis SCAN支持
 */
async function clearCacheByPattern(
  redisService: RedisService,
  pattern: string,
): Promise<void> {
  try {
    const client = redisService.getClient();
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
      await redisService.mDel(keys);
    }
  } catch (error) {
    winstonLogger.error(
      `Failed to clear cache by pattern: ${pattern}`,
      error?.toString(),
    );
  }
}

/**
 * 缓存预热装饰器
 * 用于在应用启动时预热缓存
 */
export function CacheWarmer(options: {
  keys: string[];
  values: any[];
  ttl?: number;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redisService = this.redisService || this.redis;
      if (!redisService) {
        return originalMethod.apply(this, args);
      }

      const ttl = options.ttl || DEFAULT_TTL.default;

      // 预热缓存
      for (let i = 0; i < options.keys.length; i++) {
        try {
          await (redisService as RedisService).set(
            options.keys[i],
            options.values[i],
            ttl,
          );
        } catch (error) {
          winstonLogger.error(
            `Cache warming failed for key: ${options.keys[i]}`,
            error?.toString(),
          );
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
