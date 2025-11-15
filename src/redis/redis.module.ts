import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Redis 模块
 * 提供全局的 Redis 服务
 */
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
