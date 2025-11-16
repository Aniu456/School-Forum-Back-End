import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserRoleDto {
    @IsEnum(Role, { message: '无效的角色类型' })
    role: Role;
}
