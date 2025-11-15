import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import session from 'express-session';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用 cookie-parser 中间件
  app.use(cookieParser());

  // 配置 express-session 中间件
  app.use(
    session({
      // rolling: true,
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

  // 启用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001', // 前端地址
    credentials: true, // 允许发送凭证
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 开启 URL 版本控制
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
}
void bootstrap();
