import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string; // 可以是邮箱或用户名

  @IsString()
  @IsNotEmpty()
  password: string;
}
