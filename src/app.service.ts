import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 系统健康状态检查
   */
  async getHealth() {
    try {
      // 检查数据库连接
      await this.prisma.$queryRaw`SELECT 1`;

      // 检查 Redis 连接
      const redisHealthy = await this.redis.healthCheck();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          redis: redisHealthy ? 'healthy' : 'unhealthy',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
