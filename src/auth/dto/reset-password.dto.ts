import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty({ message: '邮箱不能为空' })
    @IsEmail({}, { message: '邮箱格式不正确' })
    email: string;

    @IsNotEmpty({ message: '验证码不能为空' })
    @IsString()
    code: string;

    @IsNotEmpty({ message: '新密码不能为空' })
    @IsString()
    @MinLength(6, { message: '密码至少6个字符' })
    newPassword: string;
}
