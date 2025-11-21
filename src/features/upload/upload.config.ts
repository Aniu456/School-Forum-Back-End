import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

/**
 * 文件上传配置
 */
export const uploadConfig = {
  // 文件大小限制（字节）
  limits: {
    avatar: 2 * 1024 * 1024, // 头像：2MB
    image: 5 * 1024 * 1024, // 图片：5MB
    document: 20 * 1024 * 1024, // 文档：20MB
  },

  // 允许的文件类型
  allowedMimeTypes: {
    avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed',
    ],
  },

  // 上传目录
  uploadPaths: {
    avatar: 'uploads/avatars',
    image: 'uploads/images',
    document: 'uploads/documents',
  },
};

/**
 * 生成 Multer 存储配置
 */
export const createMulterStorage = (type: 'avatar' | 'image' | 'document') => {
  return diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadConfig.uploadPaths[type]);
    },
    filename: (req, file, cb) => {
      // 生成唯一文件名：uuid + 原始扩展名
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
};

/**
 * 文件过滤器
 */
export const createFileFilter = (type: 'avatar' | 'image' | 'document') => {
  return (req: any, file: Express.Multer.File, cb: any) => {
    const allowedTypes = uploadConfig.allowedMimeTypes[type];

    if (!allowedTypes.includes(file.mimetype)) {
      cb(
        new BadRequestException(
          `不支持的文件类型。允许的类型：${allowedTypes.join(', ')}`,
        ),
        false,
      );
      return;
    }

    cb(null, true);
  };
};

/**
 * 获取文件大小限制
 */
export const getFileSize = (type: 'avatar' | 'image' | 'document'): number => {
  return uploadConfig.limits[type];
};
