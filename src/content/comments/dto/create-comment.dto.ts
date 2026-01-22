import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  @MinLength(1, { message: '评论内容至少需要1个字符' })
  @MaxLength(1000, { message: '评论内容最多1000个字符' })
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
