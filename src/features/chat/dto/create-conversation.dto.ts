import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
    @IsNotEmpty({ message: '对方用户ID不能为空' })
    @IsString()
    participantId: string; // 对方用户ID
}
