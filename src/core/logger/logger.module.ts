import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * 全局日志模块
 * 使用@Global()装饰器使其在整个应用中可用
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
