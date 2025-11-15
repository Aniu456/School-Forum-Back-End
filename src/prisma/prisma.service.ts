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
      posts: await this.post.updateMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
          },
        },
        data: {
          isDeleted: true,
        },
      }),
      comments: await this.comment.updateMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        data: {
          isDeleted: true,
        },
      }),
    };
  }
}
