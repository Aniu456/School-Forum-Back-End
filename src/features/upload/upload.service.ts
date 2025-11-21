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
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:30000');
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
   * 删除文件
   */
  async deleteFile(filename: string, type: 'avatar' | 'image' | 'document'): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'uploads', `${type}s`, filename);

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
    const filePath = path.join(process.cwd(), 'uploads', `${type}s`, filename);
    return fs.existsSync(filePath);
  }
}
