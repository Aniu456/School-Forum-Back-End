import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // 🛡️ 安全性配置
  // ============================================

  // 1. 启用全局输入验证管道（防止注入攻击）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除未定义的属性
      forbidNonWhitelisted: true, // 如果存在未定义的属性则报错
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true, // 隐式类型转换
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境隐藏详细错误
    }),
  );

  // 2. CORS 配置：从环境变量读取允许的来源
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:5174',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 使用 cookie-parser 中间件
  app.use(cookieParser());

  // ============================================
  // 🗄️ Redis Session 配置
  // ============================================

  // 3. 验证必需的环境变量
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      '❌ 缺少必需的环境变量: SESSION_SECRET\n请在 .env 文件中设置 SESSION_SECRET',
    );
  }

  // 初始化 Redis 客户端用于 session store
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
  });

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

  // 4. Session 配置
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET, // 从环境变量读取
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 小时
        sameSite: 'lax',
      },
    }),
  );

  // 开启 URL 版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
}
void bootstrap();
