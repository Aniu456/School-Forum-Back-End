import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import {
  createMulterStorage,
  createFileFilter,
  getFileSize,
} from './upload.config';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传头像
   * POST /upload/avatar
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createMulterStorage('avatar'),
      fileFilter: createFileFilter('avatar'),
      limits: {
        fileSize: getFileSize('avatar'),
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    return this.uploadService.uploadAvatar(file);
  }

  /**
   * 上传单张图片
   * POST /upload/image
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createMulterStorage('image'),
      fileFilter: createFileFilter('image'),
      limits: {
        fileSize: getFileSize('image'),
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    return this.uploadService.uploadImage(file);
  }

  /**
   * 上传多张图片（最多9张）
   * POST /upload/images
   */
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 9, {
      storage: createMulterStorage('image'),
      fileFilter: createFileFilter('image'),
      limits: {
        fileSize: getFileSize('image'),
      },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('请上传文件');
    }

    if (files.length > 9) {
      throw new BadRequestException('最多上传9张图片');
    }

    return this.uploadService.uploadImages(files);
  }

  /**
   * 上传文档
   * POST /upload/document
   */
  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createMulterStorage('document'),
      fileFilter: createFileFilter('document'),
      limits: {
        fileSize: getFileSize('document'),
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    return this.uploadService.uploadDocument(file);
  }
}
