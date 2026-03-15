import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    // 🛡️ 验证 JWT_SECRET 环境变量
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        '❌ 缺少必需的环境变量: JWT_SECRET\n请在 .env 文件中设置 JWT_SECRET',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true, // 传递 request 以获取原始 token
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // 🛡️ 检查 token 是否在黑名单中
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const isBlacklisted = await this.redisService.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('登录已失效，请重新登录');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        isActive: true,
        isBanned: true,
        canPost: true,
        canComment: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('用户未激活');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('用户已被封禁');
    }

    return user;
  }
}