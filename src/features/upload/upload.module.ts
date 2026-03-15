import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { OssService } from './oss.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, OssService],
  exports: [UploadService],
})
export class UploadModule {}
