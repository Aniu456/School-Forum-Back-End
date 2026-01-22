import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// 日志级别配置
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志颜色配置
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// 控制台日志格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, context, trace, ...meta } = info;
    let log = `${timestamp} [${level}]`;

    if (context) {
      log += ` [${context}]`;
    }

    log += `: ${message}`;

    // 打印额外的元数据
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // 打印错误堆栈
    if (trace) {
      log += `\n${trace}`;
    }

    return log;
  }),
);

// 日志目录配置
const logDir = process.env.LOG_DIR || './logs';

// 创建日志传输器
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// 根据环境配置文件日志
if (process.env.NODE_ENV !== 'test') {
  // 错误日志文件 - 按日期轮转
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
  );

  // 综合日志文件 - 按日期轮转
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat,
    }),
  );

  // HTTP请求日志文件 - 按日期轮转
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/http-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
      format: customFormat,
    }),
  );
}

// 创建Winston logger实例
export const winstonLogger = winston.createLogger({
  levels: logLevels,
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: customFormat,
  transports,
  // 处理未捕获的异常和Promise拒绝
  exceptionHandlers: [
    new DailyRotateFile({
      filename: `${logDir}/exceptions-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: `${logDir}/rejections-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// 导出日志级别类型
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';
