import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterAdminDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  adminKey: string; // 管理员注册密钥
}
