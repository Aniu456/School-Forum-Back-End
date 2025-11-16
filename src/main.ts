import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 配置：只允许这几个前端端口访问
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
  });

  // 使用 cookie-parser 中间件
  app.use(cookieParser());

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
    console.warn('⚠️  将使用内存 Session 存储 (仅用于开发)');
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // 在生产环境中使用 https
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
