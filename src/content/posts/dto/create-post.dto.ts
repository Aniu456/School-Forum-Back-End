import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(5, { message: '标题至少需要5个字符' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title: string;

  @IsString()
  @MinLength(10, { message: '内容至少需要10个字符' })
  @MaxLength(50000, { message: '内容最多50000个字符' })
  content: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: '图片URL格式不正确' })
  @ArrayMaxSize(9, { message: '最多上传9张图片' })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: '最多添加10个标签' })
  tags?: string[];
}
