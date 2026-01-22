import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../core/prisma/prisma.service';
import { RedisService } from '../core/redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => RedisService))
    private redisService: RedisService,
  ) {
    // 🛡️ 验证必需的环境变量（启动时检查）
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET')!;

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error(
        '❌ 缺少必需的环境变量: JWT_SECRET 或 JWT_REFRESH_SECRET\n' +
        '请在 .env 文件中设置这些变量',
      );
    }

    // 设置默认过期时间
    this.jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    this.jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 创建用户（强制设置为 USER 角色）
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
        nickname: registerDto.nickname || registerDto.username,
        role: Role.USER, // 强制设置为普通用户角色
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    // 生成 JWT Token
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * 用户登录
   * 支持使用邮箱或用户名登录
   */
  async login(loginDto: LoginDto) {
    // 查找用户 - 支持邮箱或用户名
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: loginDto.email },
          { username: loginDto.email },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 检查用户状态
    if (!user.isActive) {
      throw new UnauthorizedException('用户未激活');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('用户已被封禁');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱/用户名或密码错误');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // 生成 JWT Token
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 返回用户信息（不包含密码）
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret, // 使用类属性
      });

      // 验证用户是否存在且有效
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      if (!user.isActive || user.isBanned) {
        throw new UnauthorizedException('用户状态异常');
      }

      // 生成新的 Token
      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Refresh Token 无效或已过期');
    }
  }

  /**
   * 生成 Access Token 和 Refresh Token
   */
  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      // @ts-expect-error - NestJS JwtService 类型定义不支持自定义 secret，但运行时支持
      this.jwtService.signAsync(payload, {
        secret: this.jwtSecret, // 使用类属性（已在构造函数中验证）
        expiresIn: this.jwtExpiresIn,
      }),
      // @ts-expect-error - NestJS JwtService 类型定义不支持自定义 secret，但运行时支持
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret, // 使用类属性
        expiresIn: this.jwtRefreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * 验证用户（用于 Local Strategy）
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 管理员注册（需要管理员密钥）
   */
  async registerAdmin(registerAdminDto: RegisterAdminDto) {
    // 验证管理员密钥
    const adminKey = this.configService.get<string>('ADMIN_REGISTRATION_KEY');
    if (!adminKey || registerAdminDto.adminKey !== adminKey) {
      throw new ForbiddenException('管理员注册密钥无效');
    }

    // 检查是否已存在管理员（系统只允许一个管理员账号）
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin) {
      throw new ForbiddenException('管理员账号已存在，系统只允许一个管理员');
    }

    // 检查用户名是否已存在
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerAdminDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerAdminDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(registerAdminDto.password, 10);

    // 创建管理员用户
    const admin = await this.prisma.user.create({
      data: {
        username: registerAdminDto.username,
        email: registerAdminDto.email,
        password: hashedPassword,
        nickname: registerAdminDto.nickname || registerAdminDto.username,
        role: Role.ADMIN, // 设置为管理员角色
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    // 生成 JWT Token
    const tokens = await this.generateTokens(admin.id, admin.email, admin.role);

    return {
      user: admin,
      ...tokens,
    };
  }

  /**
   * 忘记密码 - 发送验证码
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('该邮箱未注册');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'RESET_PASSWORD',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        userId: user.id,
      },
    });

    console.log(`Password reset code for ${email}: ${code}`);

    return {
      message: '验证码已发送到邮箱',
      ...(process.env.NODE_ENV === 'development' && { code }),
    };
  }

  /**
   * 重置密码
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'RESET_PASSWORD',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new UnauthorizedException('验证码无效或已过期');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    return {
      message: '密码重置成功',
    };
  }

  /**
   * 登出 - 将 token 加入黑名单
   */
  async logout(token: string): Promise<{ message: string }> {
    try {
      // 解码 token 获取过期时间
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;
      
      if (decoded?.exp) {
        // 计算 token 剩余有效期（秒）
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (ttl > 0) {
          // 将 token 加入 Redis 黑名单，过期时间与 token 一致
          await this.redisService.set(`blacklist:${token}`, '1', ttl);
        }
      }
    } catch (error) {
      console.error('Failed to blacklist token:', error);
    }

    return { message: '登出成功' };
  }

  /**
   * 检查 token 是否在黑名单中
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const result = await this.redisService.get(`blacklist:${token}`);
      return result !== null;
    } catch (error) {
      console.error('Failed to check token blacklist:', error);
      return false;
    }
  }
}
