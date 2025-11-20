import { ValidationPipe } from '@nestjs/common';

/**
 * 全局验证管道配置
 */
export const validationPipeConfig = new ValidationPipe({
  whitelist: true, // 自动移除未定义的属性
  forbidNonWhitelisted: true, // 如果存在未定义的属性则报错
  transform: true, // 自动转换类型
  transformOptions: {
    enableImplicitConversion: true, // 隐式类型转换
  },
  disableErrorMessages: process.env.NODE_ENV === 'production', // 生产环境隐藏详细错误
});

/**
 * CORS 配置
 */
export const corsConfig = {
  origin:
    process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Session 配置
 */
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 小时
    sameSite: 'lax' as const,
  },
};

/**
 * Redis 配置
 */
export const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD,
};

