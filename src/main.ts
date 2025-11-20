import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import {
  validationPipeConfig,
  corsConfig,
  sessionConfig,
  redisConfig,
} from './config/app.config';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // 🛡️ 全局配置
  // ============================================

  // 1. 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 2. 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. 全局验证管道
  app.useGlobalPipes(validationPipeConfig);

  // 4. CORS 配置
  app.enableCors(corsConfig);

  // 5. Cookie 解析中间件
  app.use(cookieParser());

  // ============================================
  // 🗄️ Redis Session 配置
  // ============================================

  // 验证必需的环境变量
  if (!sessionConfig.secret) {
    throw new Error(
      '❌ 缺少必需的环境变量: SESSION_SECRET\n请在 .env 文件中设置 SESSION_SECRET',
    );
  }

  // 初始化 Redis 客户端用于 session store
  const redisClient = createClient(redisConfig);

  let sessionStore: any = undefined;
  try {
    await redisClient.connect();
    console.log('✅ Redis Session Store 已连接');
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'session:',
    });
  } catch (error) {
    console.error('❌ Redis 连接失败:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境必须连接 Redis');
    }
    console.warn('⚠️  将使用内存 Session 存储 (仅用于开发)');
  }

  // Session 配置
  app.use(
    session({
      ...sessionConfig,
      store: sessionStore,
    }),
  );

  // ============================================
  // 🚀 启动配置
  // ============================================

  // 开启 URL 版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 校园论坛后端系统已启动                            ║
║                                                       ║
║   📍 服务地址: http://localhost:${port}                 ║
║   🌍 环境: ${process.env.NODE_ENV || 'development'}                          ║
║   📚 API 文档: http://localhost:${port}/health          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

void bootstrap();
