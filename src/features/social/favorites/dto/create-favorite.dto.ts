import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  postId: string;

  @IsOptional()
  @IsString()
  folderId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
