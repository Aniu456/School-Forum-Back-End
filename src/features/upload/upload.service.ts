import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  /**
   * 生成文件访问 URL
   */
  generateFileUrl(filename: string, type: 'avatar' | 'image' | 'document'): string {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${type}s/${filename}`;
  }

  /**
   * 处理头像上传
   */
  async uploadAvatar(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const url = this.generateFileUrl(file.filename, 'avatar');

    return {
      filename: file.filename,
      url,
    };
  }

  /**
   * 处理图片上传
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const url = this.generateFileUrl(file.filename, 'image');

    return {
      filename: file.filename,
      url,
    };
  }

  /**
   * 处理多图片上传
   */
  async uploadImages(files: Express.Multer.File[]): Promise<{ urls: string[]; filenames: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传文件');
    }

    const urls = files.map(file => this.generateFileUrl(file.filename, 'image'));
    const filenames = files.map(file => file.filename);

    return {
      filenames,
      urls,
    };
  }

  /**
   * 处理文档上传
   */
  async uploadDocument(file: Express.Multer.File): Promise<{ url: string; filename: string; originalName: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const url = this.generateFileUrl(file.filename, 'document');

    return {
      filename: file.filename,
      originalName: file.originalname,
      url,
    };
  }

  /**
   * 安全地构建文件路径，防止路径遍历攻击
   */
  private getSafeFilePath(filename: string, type: 'avatar' | 'image' | 'document'): string | null {
    // 移除任何路径分隔符，只保留文件名
    const safeFilename = path.basename(filename);
    
    // 检查文件名是否被修改（包含路径遍历尝试）
    if (safeFilename !== filename || filename.includes('..')) {
      console.warn(`路径遍历攻击尝试被阻止: ${filename}`);
      return null;
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', `${type}s`);
    const filePath = path.join(uploadsDir, safeFilename);

    // 验证最终路径是否在上传目录内
    if (!filePath.startsWith(uploadsDir)) {
      console.warn(`路径遍历攻击尝试被阻止: ${filename}`);
      return null;
    }

    return filePath;
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string, type: 'avatar' | 'image' | 'document'): Promise<void> {
    try {
      const filePath = this.getSafeFilePath(filename, type);
      
      if (!filePath) {
        console.warn(`无效的文件名: ${filename}`);
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      // 不抛出异常，避免影响业务逻辑
    }
  }

  /**
   * 验证文件是否存在
   */
  fileExists(filename: string, type: 'avatar' | 'image' | 'document'): boolean {
    const filePath = this.getSafeFilePath(filename, type);
    
    if (!filePath) {
      return false;
    }

    return fs.existsSync(filePath);
  }
}
