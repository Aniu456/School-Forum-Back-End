import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ConversationsService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
    ) { }

    /**
     * 创建或获取与指定用户的会话
     */
    async createOrGetConversation(
        currentUserId: string,
        createDto: CreateConversationDto,
    ) {
        const { participantId } = createDto;

        // 不能和自己创建会话
        if (currentUserId === participantId) {
            throw new BadRequestException('不能和自己创建会话');
        }

        // 检查对方用户是否存在
        const participant = await this.prisma.user.findUnique({
            where: { id: participantId },
        });

        if (!participant) {
            throw new NotFoundException('对方用户不存在');
        }

        // 查找是否已存在会话（双向查找）
        const existingConversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                participants: {
                    every: {
                        userId: { in: [currentUserId, participantId] },
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                                avatar: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (existingConversation) {
            // 确保会话有且仅有这两个参与者
            const participantIds = existingConversation.participants.map(
                (p) => p.userId,
            );
            if (
                participantIds.length === 2 &&
                participantIds.includes(currentUserId) &&
                participantIds.includes(participantId)
            ) {
                return this.formatConversation(existingConversation, currentUserId);
            }
        }

        // 创建新会话
        const conversation = await this.prisma.conversation.create({
            data: {
                type: 'DIRECT',
                participants: {
                    create: [
                        { userId: currentUserId },
                        { userId: participantId },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                                avatar: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        return this.formatConversation(conversation, currentUserId);
    }

    /**
     * 获取当前用户的会话列表
     */
    async getConversations(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [conversations, total] = await Promise.all([
            this.prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { userId },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    nickname: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
                orderBy: {
                    updatedAt: 'desc', // 按最后更新时间排序（会话的updatedAt会在发消息时更新）
                },
                skip,
                take: limit,
            }),
            this.prisma.conversation.count({
                where: {
                    participants: {
                        some: { userId },
                    },
                },
            }),
        ]);

        return {
            data: conversations.map((conv) => this.formatConversation(conv, userId)),
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    /**
     * 获取会话详情
     */
    async getConversation(conversationId: string, userId: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true,
                                avatar: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!conversation) {
            throw new NotFoundException('会话不存在');
        }

        // 验证用户是否是会话参与者
        const isParticipant = conversation.participants.some(
            (p) => p.userId === userId,
        );
        if (!isParticipant) {
            throw new ForbiddenException('无权访问此会话');
        }

        return this.formatConversation(conversation, userId);
    }

    /**
     * 获取会话消息列表
     */
    async getMessages(
        conversationId: string,
        userId: string,
        page: number = 1,
        limit: number = 50,
    ) {
        // 验证会话存在且用户有权限
        await this.getConversation(conversationId, userId);

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    conversationId,
                    isDeleted: false,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.message.count({
                where: {
                    conversationId,
                    isDeleted: false,
                },
            }),
        ]);

        // 更新最后已读时间
        await this.prisma.conversationParticipant.updateMany({
            where: {
                conversationId,
                userId,
            },
            data: {
                lastReadAt: new Date(),
            },
        });

        return {
            data: messages.reverse(), // 反转为正序（旧消息在前）
            meta: {
                page,
                limit,
                total,
            },
        };
    }

    /**
     * 发送消息
     */
    async sendMessage(
        conversationId: string,
        userId: string,
        sendDto: SendMessageDto,
    ) {
        // 验证会话存在且用户有权限
        await this.getConversation(conversationId, userId);

        const message = await this.prisma.$transaction(async (tx) => {
            const newMessage = await tx.message.create({
                data: {
                    conversationId,
                    senderId: userId,
                    content: sendDto.content,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            nickname: true,
                            avatar: true,
                        },
                    },
                },
            });

            // 更新会话的updatedAt以便排序
            await tx.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });

            return newMessage;
        });

        // 发送私信通知给对方
        try {
            const conversation = await this.getConversation(conversationId, userId);
            if (conversation.otherUser) {
                await this.notificationsService.create({
                    userId: conversation.otherUser.id,
                    type: 'SYSTEM',
                    senderId: userId,
                    content: `给你发了私信: ${sendDto.content.substring(0, 30)}${sendDto.content.length > 30 ? '...' : ''}`,
                    relatedId: conversationId,
                });
            }
        } catch (error) {
            console.error('Failed to send message notification:', error);
        }

        return message;
    }

    /**
     * 删除消息（软删除）
     */
    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('消息不存在');
        }

        if (message.senderId !== userId) {
            throw new ForbiddenException('只能删除自己的消息');
        }

        if (message.isDeleted) {
            throw new BadRequestException('消息已被删除');
        }

        await this.prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true },
        });

        return { message: '消息删除成功' };
    }

    /**
     * 获取未读消息数
     */
    async getUnreadCount(userId: string) {
        const participants = await this.prisma.conversationParticipant.findMany({
            where: { userId },
            select: {
                conversationId: true,
                lastReadAt: true,
            },
        });

        let totalUnread = 0;

        for (const participant of participants) {
            const unreadCount = await this.prisma.message.count({
                where: {
                    conversationId: participant.conversationId,
                    senderId: { not: userId },
                    isDeleted: false,
                    createdAt: {
                        gt: participant.lastReadAt || new Date(0),
                    },
                },
            });
            totalUnread += unreadCount;
        }

        return { count: totalUnread };
    }

    /**
     * 格式化会话对象
     */
    private formatConversation(conversation: any, currentUserId: string) {
        // 找出对方用户
        const otherParticipant = conversation.participants.find(
            (p: any) => p.userId !== currentUserId,
        );

        const lastMessage = conversation.messages[0] || null;

        // 计算未读数
        const myParticipant = conversation.participants.find(
            (p: any) => p.userId === currentUserId,
        );

        return {
            id: conversation.id,
            type: conversation.type,
            otherUser: otherParticipant?.user || null,
            lastMessage: lastMessage
                ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    senderId: lastMessage.senderId,
                    createdAt: lastMessage.createdAt,
                }
                : null,
            lastReadAt: myParticipant?.lastReadAt,
            createdAt: conversation.createdAt,
        };
    }
}
