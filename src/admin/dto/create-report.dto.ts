import { IsEnum, IsString, MinLength, IsUUID } from 'class-validator';
import { ReportTarget } from '@prisma/client';

export class CreateReportDto {
  @IsUUID()
  targetId: string;

  @IsEnum(ReportTarget)
  targetType: ReportTarget;

  @IsString()
  @MinLength(5, { message: '举报理由至少需要5个字符' })
  reason: string;
}
