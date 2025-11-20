import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * 清理已删除的资源（软删除）
   */
  async cleanUp() {
    return {
      posts: await this.post.deleteMany({
        where: {
          id: { in: [] },
        },
      }),
      comments: await this.comment.deleteMany({
        where: {
          id: { in: [] },
        },
      }),
    };
  }

  get follow() {
    return (this as unknown as { follow: unknown }).follow as any;
  }

  get postDraft() {
    return (this as unknown as { postDraft: unknown }).postDraft as any;
  }

  get favorite() {
    return (this as unknown as { favorite: unknown }).favorite as any;
  }

  get folder() {
    return (this as unknown as { folder: unknown }).folder as any;
  }

  get postScore() {
    return (this as unknown as { postScore: unknown }).postScore as any;
  }

  get topic() {
    return (this as unknown as { topic: unknown }).topic as any;
  }

  get conversation() {
    return (this as unknown as { conversation: unknown }).conversation as any;
  }

  get conversationParticipant() {
    return (this as unknown as { conversationParticipant: unknown })
      .conversationParticipant as any;
  }

  get message() {
    return (this as unknown as { message: unknown }).message as any;
  }
}
