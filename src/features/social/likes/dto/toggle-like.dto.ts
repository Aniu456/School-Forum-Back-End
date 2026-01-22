import { IsString, IsEnum } from 'class-validator';
import { TargetType } from '@prisma/client';

export class ToggleLikeDto {
  @IsString()
  targetId: string;

  @IsEnum(TargetType)
  targetType: TargetType;
}
