import { IsBoolean } from 'class-validator';

export class ToggleUserPermissionDto {
    @IsBoolean()
    canPost: boolean;

    @IsBoolean()
    canComment: boolean;
}
