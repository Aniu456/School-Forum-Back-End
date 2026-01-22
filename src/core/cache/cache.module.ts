import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisModule } from '../redis/redis.module';

/**
 * 全局缓存模块
 * 提供缓存服务和装饰器
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
