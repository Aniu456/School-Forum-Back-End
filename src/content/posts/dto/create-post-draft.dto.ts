import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePostDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '标题最多200个字符' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000, { message: '内容最多50000个字符' })
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: '最多添加10个标签' })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: '图片URL格式不正确' })
  @ArrayMaxSize(9, { message: '最多上传9张图片' })
  images?: string[];
}

export class UpdatePostDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '标题最多200个字符' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000, { message: '内容最多50000个字符' })
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10, { message: '最多添加10个标签' })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: '图片URL格式不正确' })
  @ArrayMaxSize(9, { message: '最多上传9张图片' })
  images?: string[];
}
