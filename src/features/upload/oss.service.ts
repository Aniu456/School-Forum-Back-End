import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import * as fs from 'fs';

@Injectable()
export class OssService {
  private client: InstanceType<typeof OSS> | null = null;
  private readonly logger = new Logger(OssService.name);
  private readonly customDomain: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID', '');
    const accessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET', '');
    const region = this.configService.get<string>('OSS_REGION', '');
    const bucket = this.configService.get<string>('OSS_BUCKET', '');
    this.customDomain = this.configService.get<string>('OSS_CUSTOM_DOMAIN', '');

    const isPlaceholder = (v: string) =>
      !v || v.startsWith('your-') || v === '';

    if (
      !isPlaceholder(accessKeyId) &&
      !isPlaceholder(accessKeySecret) &&
      region &&
      bucket
    ) {
      this.client = new OSS({
        region,
        accessKeyId,
        accessKeySecret,
        bucket,
        secure: this.configService.get<string>('OSS_SECURE') !== 'false',
        timeout: parseInt(
          this.configService.get<string>('OSS_TIMEOUT', '60000'),
        ),
      });
      this.logger.log('阿里云 OSS 已初始化，文件将上传至 OSS');
    } else {
      this.logger.log('未配置 OSS，使用本地存储');
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * 将本地文件上传到 OSS，上传成功后删除本地临时文件
   * @param localFilePath 本地文件路径
   * @param ossKey OSS 对象键（路径）
   */
  async uploadFile(localFilePath: string, ossKey: string): Promise<string> {
    if (!this.client) {
      throw new Error('OSS 未初始化');
    }

    try {
      const result = await this.client.put(ossKey, localFilePath);

      // 上传成功后删除本地临时文件
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      // 优先使用自定义域名（CDN）
      if (this.customDomain && !this.customDomain.startsWith('https://cdn.yourdomain')) {
        return `${this.customDomain.replace(/\/$/, '')}/${ossKey}`;
      }

      return result.url;
    } catch (error) {
      this.logger.error(`OSS 上传失败: ${ossKey}`, error);
      throw error;
    }
  }

  /**
   * 删除 OSS 上的文件
   * @param ossKey OSS 对象键
   */
  async deleteFile(ossKey: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.delete(ossKey);
    } catch (error) {
      this.logger.error(`OSS 删除失败: ${ossKey}`, error);
    }
  }
}
