import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { winstonLogger } from '../../logger';

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 过滤敏感路径（如健康检查）
    const skipPaths = ['/health', '/favicon.ico'];
    if (skipPaths.some(path => originalUrl.startsWith(path))) {
      return next();
    }

    // 记录请求开始
    winstonLogger.http(`Incoming request: ${method} ${originalUrl}`, {
      ip,
      userAgent: userAgent.substring(0, 100),
    });

    // 记录请求参数
    if (req.query && Object.keys(req.query).length > 0) {
      winstonLogger.debug('Query parameters', req.query as Record<string, any>);
    }

    if (req.body && Object.keys(req.body).length > 0) {
      // 过滤敏感信息（如密码、token）
      const sanitizedBody = this.sanitizeBody(req.body);
      winstonLogger.debug('Request body', sanitizedBody);
    }

    // 监听响应结束事件
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // 根据状态码使用不同的日志级别
      let logLevel = 'info';
      if (statusCode >= 400 && statusCode < 500) {
        logLevel = 'warn';
      } else if (statusCode >= 500) {
        logLevel = 'error';
      }

      winstonLogger[logLevel](
        `${method} ${originalUrl} ${statusCode} ${duration}ms`,
        {
          statusCode,
          duration,
          ip,
        }
      );
    });

    next();
  }

  /**
   * 过滤请求体中的敏感信息
   */
  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'token', 'accessToken', 'refreshToken'];

    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '******';
      }
    }

    return sanitized;
  }
}
