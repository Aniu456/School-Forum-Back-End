import { IsOptional, IsUUID } from 'class-validator';

export class CreateFollowDto {
  @IsOptional()
  @IsUUID()
  followingId?: string;
}
