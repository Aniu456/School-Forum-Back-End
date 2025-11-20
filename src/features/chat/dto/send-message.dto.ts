import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty({ message: '消息内容不能为空' })
    @IsString()
    @MaxLength(2000, { message: '消息内容不能超过2000字' })
    content: string;
}
