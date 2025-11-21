import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
    @IsNotEmpty({ message: '对方用户ID不能为空' })
    @IsUUID('4', { message: '对方用户ID格式不正确' })
    participantId: string; // 对方用户ID
}
