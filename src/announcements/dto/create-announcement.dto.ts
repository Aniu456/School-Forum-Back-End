import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AnnouncementType, Role } from '@prisma/client';

export class CreateAnnouncementDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsEnum(AnnouncementType)
    @IsOptional()
    type?: AnnouncementType = AnnouncementType.INFO;

    @IsEnum(Role)
    @IsOptional()
    targetRole?: Role; // 空表示所有人

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean = false;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean = false;
}
