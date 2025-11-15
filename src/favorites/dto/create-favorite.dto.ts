import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  postId: string;

  @IsUUID()
  folderId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
