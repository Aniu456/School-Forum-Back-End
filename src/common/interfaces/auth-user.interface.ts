import { Role } from '@prisma/client';

/**
 * 认证用户接口
 * 用于 JWT 解析后的用户信息
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * 用户选择字段（用于 Prisma select）
 */
export const USER_SELECT_BASIC = {
  id: true,
  username: true,
  nickname: true,
  avatar: true,
} as const;

export const USER_SELECT_PUBLIC = {
  id: true,
  username: true,
  nickname: true,
  avatar: true,
  bio: true,
  role: true,
  createdAt: true,
} as const;

