import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();
            const token = this.extractTokenFromHandshake(client);

            if (!token) {
                throw new WsException('未提供认证令牌');
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key',
            });

            // 将用户信息附加到 socket.data
            client.data.userId = payload.sub;
            client.data.email = payload.email;
            client.data.role = payload.role;

            return true;
        } catch (error) {
            this.logger.error(`WebSocket authentication failed: ${error.message}`);
            throw new WsException('认证失败');
        }
    }

    private extractTokenFromHandshake(client: Socket): string | undefined {
        // 尝试从多个来源提取 token
        const authHeader = client.handshake?.headers?.authorization;
        const queryToken = client.handshake?.query?.token as string;
        const authToken = client.handshake?.auth?.token;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        return queryToken || authToken;
    }
}
