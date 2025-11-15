import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class HandleReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  handleNote?: string;
}
