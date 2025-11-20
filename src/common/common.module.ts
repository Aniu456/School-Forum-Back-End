import { Module, Global } from '@nestjs/common';

/**
 * 全局公共模块
 * 提供共享的服务、装饰器、守卫等
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonModule {}

