import { IsOptional, IsString } from 'class-validator';

export class CreateFollowDto {
  @IsOptional()
  @IsString()
  followingId?: string;
}
