import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    console.log(`📍 请求路径: ${method} ${originalUrl}`);
    // console.log(`🌐 客户端IP: ${ip}`);
    // console.log(`🖥️  User-Agent: ${userAgent}`);

    // 记录请求参数
    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`📝 Query参数:`, req.query);
    }

    if (req.body && Object.keys(req.body).length > 0) {
      // 过滤敏感信息（如密码）
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) {
        sanitizedBody.password = '******';
      }
      console.log(`📦 Body内容:`, sanitizedBody);
    }

    // 监听响应结束事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 根据状态码使用不同的图标和颜色提示
      let statusEmoji = '✅';
      if (statusCode >= 400 && statusCode < 500) {
        statusEmoji = '⚠️ ';
      } else if (statusCode >= 500) {
        statusEmoji = '❌';
      }

      // console.log(`${statusEmoji} 响应状态: ${statusCode}`);
      // console.log(`⏱️  响应时间: ${duration}ms`);
      console.log(
        '🔵 ============================================================\n',
      );
    });

    next();
  }
}
