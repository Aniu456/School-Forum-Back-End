import { IsUUID, IsEnum } from 'class-validator';
import { TargetType } from '@prisma/client';

export class ToggleLikeDto {
  @IsUUID()
  targetId: string;

  @IsEnum(TargetType)
  targetType: TargetType;
}
