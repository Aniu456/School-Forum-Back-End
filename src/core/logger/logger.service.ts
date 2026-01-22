import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { winstonLogger, LogLevel } from './winston.config';

/**
 * Winston日志服务
 * 实现NestJS LoggerService接口，可在整个应用中注入使用
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  /**
   * 设置日志上下文
   */
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  /**
   * 记录日志
   */
  private logMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
  ) {
    const logMeta = meta ? { ...meta, context: this.context } : { context: this.context };
    winstonLogger.log(level, message, logMeta);
  }

  /**
   * 普通日志
   */
  log(message: string, meta?: Record<string, any>) {
    this.logMessage('info', message, meta);
  }

  /**
   * 错误日志
   */
  error(message: string, trace?: string, meta?: Record<string, any>) {
    this.logMessage('error', message, {
      ...meta,
      trace,
    });
  }

  /**
   * 警告日志
   */
  warn(message: string, meta?: Record<string, any>) {
    this.logMessage('warn', message, meta);
  }

  /**
   * 调试日志
   */
  debug(message: string, meta?: Record<string, any>) {
    this.logMessage('debug', message, meta);
  }

  /**
   * 详细日志
   */
  verbose(message: string, meta?: Record<string, any>) {
    this.logMessage('debug', message, meta);
  }

  /**
   * HTTP请求日志
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    meta?: Record<string, any>,
  ) {
    this.logMessage('http', `${method} ${url} ${statusCode} ${duration}ms`, meta);
  }

  /**
   * 数据库查询日志
   */
  logQuery(query: string, params?: any[], duration?: number) {
    const message = duration
      ? `Query executed in ${duration}ms`
      : 'Query executed';

    this.logMessage('debug', message, {
      query: query.substring(0, 100), // 限制查询长度
      params,
    });
  }

  /**
   * 缓存操作日志
   */
  logCache(operation: 'get' | 'set' | 'del', key: string, hit?: boolean) {
    this.logMessage('debug', `Cache ${operation}: ${key}`, { hit });
  }

  /**
   * 安全事件日志
   */
  logSecurity(event: string, details: Record<string, any>) {
    this.logMessage('warn', `Security Event: ${event}`, details);
  }

  /**
   * 业务事件日志
   */
  logBusiness(event: string, details: Record<string, any>) {
    this.logMessage('info', `Business Event: ${event}`, details);
  }
}

/**
 * 创建带上下文的Logger实例
 * 用于在类中快速创建logger
 */
export function createLogger(context: string): LoggerService {
  const logger = new LoggerService();
  logger.setContext(context);
  return logger;
}
