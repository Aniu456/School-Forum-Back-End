import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { OssService } from './oss.service';

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService,
    private ossService: OssService,
  ) {}

  /**
   * 生成本地文件访问 URL
   */
  private generateLocalUrl(filename: string, type: 'avatar' | 'image' | 'document'): string {
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${type}s/${filename}`;
  }

  /**
   * 处理文件上传：OSS 或本地
   * - 本地存储时：文件已由 multer 写入磁盘，直接返回本地 URL
   * - OSS 存储时：将磁盘临时文件上传到 OSS，上传后删除临时文件，返回 OSS URL
   */
  private async processFile(
    file: Express.Multer.File,
    type: 'avatar' | 'image' | 'document',
  ): Promise<{ url: string; filename: string }> {
    if (this.ossService.isEnabled) {
      const ossKey = `${type}s/${file.filename}`;
      const url = await this.ossService.uploadFile(file.path, ossKey);
      return { filename: file.filename, url };
    }

    const url = this.generateLocalUrl(file.filename, type);
    return { filename: file.filename, url };
  }

  /**
   * 处理头像上传
   */
  async uploadAvatar(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.processFile(file, 'avatar');
  }

  /**
   * 处理图片上传
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.processFile(file, 'image');
  }

  /**
   * 处理多图片上传
   */
  async uploadImages(files: Express.Multer.File[]): Promise<{ urls: string[]; filenames: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传文件');
    }

    const results = await Promise.all(files.map(file => this.processFile(file, 'image')));
    return {
      urls: results.map(r => r.url),
      filenames: results.map(r => r.filename),
    };
  }

  /**
   * 处理文档上传
   */
  async uploadDocument(file: Express.Multer.File): Promise<{ url: string; filename: string; originalName: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    const result = await this.processFile(file, 'document');
    return { ...result, originalName: file.originalname };
  }

  /**
   * 安全地构建文件路径，防止路径遍历攻击
   */
  private getSafeFilePath(filename: string, type: 'avatar' | 'image' | 'document'): string | null {
    const safeFilename = path.basename(filename);

    if (safeFilename !== filename || filename.includes('..')) {
      console.warn(`路径遍历攻击尝试被阻止: ${filename}`);
      return null;
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', `${type}s`);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!filePath.startsWith(uploadsDir)) {
      console.warn(`路径遍历攻击尝试被阻止: ${filename}`);
      return null;
    }

    return filePath;
  }

  /**
   * 删除文件（本地或 OSS）
   */
  async deleteFile(filename: string, type: 'avatar' | 'image' | 'document'): Promise<void> {
    try {
      if (this.ossService.isEnabled) {
        await this.ossService.deleteFile(`${type}s/${filename}`);
        return;
      }

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
    }
  }

  /**
   * 验证文件是否存在（仅本地模式）
   */
  fileExists(filename: string, type: 'avatar' | 'image' | 'document'): boolean {
    if (this.ossService.isEnabled) return true; // OSS 文件无法简单判断，默认认为存在

    const filePath = this.getSafeFilePath(filename, type);
    if (!filePath) return false;
    return fs.existsSync(filePath);
  }
}
