import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleUserPermissionDto {
    @IsBoolean()
    @IsOptional()
    canPost?: boolean;

    @IsBoolean()
    @IsOptional()
    canComment?: boolean;
}
