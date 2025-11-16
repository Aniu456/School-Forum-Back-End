import { IsString, MinLength } from 'class-validator';

export class ResetUserPasswordDto {
    @IsString()
    @MinLength(6, { message: '密码至少 6 位' })
    newPassword: string;
}
