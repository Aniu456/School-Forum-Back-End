import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { RedisStore } from 'connect-redis';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { join } from 'path';
import { createClient } from 'redis';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/common/filters';
import { TransformInterceptor } from './core/common/interceptors';
import { winstonLogger } from './core/logger';
import {
  corsConfig,
  redisConfig,
  sessionConfig,
  validationPipeConfig,
} from './core/config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ============================================
  // 📁 静态文件服务配置
  // ============================================

  // 配置上传文件的静态访问路径
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ============================================
  // 🛡️ 全局配置
  // ============================================

  // 1. 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());
  // 2. 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // ============================================
  // 📚 Swagger API 文档配置
  // ============================================
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('校园论坛 API')
      .setDescription('校园论坛后端系统接口文档')
      .setVersion('1.0')
      .addTag('auth', '认证相关接口')
      .addTag('users', '用户管理')
      .addTag('posts', '帖子管理')
      .addTag('comments', '评论管理')
      .addTag('social', '社交功能（关注、点赞、收藏）')
      .addTag('notifications', '通知管理')
      .addTag('admin', '管理员功能')
      .addTag('search', '搜索功能')
      .addTag('upload', '文件上传')
      .addTag('announcements', '公告管理')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: '请输入JWT token',
          in: 'header',
        },
        'JWT-auth', // 这个名字要和控制器中的 @ApiBearerAuth() 一致
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // 持久化认证信息
        tagsSorter: 'alpha', // 按字母顺序排序标签
        operationsSorter: 'alpha', // 按字母顺序排序操作
      },
      customSiteTitle: '校园论坛 API 文档',
    });

    winstonLogger.info('Swagger documentation available at /api-docs');
  }

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
    winstonLogger.info('Redis Session Store connected');
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'session:',
    });
  } catch (error) {
    winstonLogger.error('Redis connection failed', error?.toString());
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境必须连接 Redis');
    }
    winstonLogger.warn('Using memory Session store (development only)');
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
  await app.listen(port);
  winstonLogger.info(`
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
}

void bootstrap();
