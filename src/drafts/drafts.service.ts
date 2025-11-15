import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePostDraftDto,
  UpdatePostDraftDto,
} from './dto/create-post-draft.dto';

@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建或更新草稿
   */
  async createOrUpdateDraft(
    userId: string,
    createPostDraftDto: CreatePostDraftDto,
  ) {
    // 检查是否已经有草稿
    const existingDraft = await this.prisma.postDraft.findFirst({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingDraft) {
      // 更新现有草稿
      const updatedDraft = await this.prisma.postDraft.update({
        where: { id: existingDraft.id },
        data: {
          ...createPostDraftDto,
          images: createPostDraftDto.images || [],
          tags: createPostDraftDto.tags || [],
        },
      });
      return updatedDraft;
    }

    // 创建新草稿
    const draft = await this.prisma.postDraft.create({
      data: {
        authorId: userId,
        ...createPostDraftDto,
        images: createPostDraftDto.images || [],
        tags: createPostDraftDto.tags || [],
      },
    });

    return draft;
  }

  /**
   * 获取用户的草稿列表
   */
  async getDrafts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [drafts, total] = await Promise.all([
      this.prisma.postDraft.findMany({
        where: { authorId: userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.postDraft.count({
        where: { authorId: userId },
      }),
    ]);

    return {
      data: drafts,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * 获取单个草稿详情
   */
  async getDraftById(userId: string, draftId: string) {
    const draft = await this.prisma.postDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.authorId !== userId) {
      throw new BadRequestException('无权访问此草稿');
    }

    return draft;
  }

  /**
   * 更新草稿
   */
  async updateDraft(
    userId: string,
    draftId: string,
    updatePostDraftDto: UpdatePostDraftDto,
  ) {
    const draft = await this.prisma.postDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.authorId !== userId) {
      throw new BadRequestException('无权修改此草稿');
    }

    const updatedDraft = await this.prisma.postDraft.update({
      where: { id: draftId },
      data: updatePostDraftDto,
    });

    return updatedDraft;
  }

  /**
   * 删除草稿
   */
  async deleteDraft(userId: string, draftId: string) {
    const draft = await this.prisma.postDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.authorId !== userId) {
      throw new BadRequestException('无权删除此草稿');
    }

    await this.prisma.postDraft.delete({
      where: { id: draftId },
    });

    return { message: '草稿已删除' };
  }

  /**
   * 从草稿发布帖子
   */
  async publishDraft(userId: string, draftId: string) {
    const draft = await this.prisma.postDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.authorId !== userId) {
      throw new BadRequestException('无权发布此草稿');
    }

    // 检查必填字段
    if (!draft.title || !draft.content) {
      throw new BadRequestException('标题和内容不能为空');
    }

    // 创建帖子
    const post = await this.prisma.post.create({
      data: {
        title: draft.title,
        content: draft.content,
        images: draft.images || [],
        tags: draft.tags || [],
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // 更新草稿中的 postId
    await this.prisma.postDraft.update({
      where: { id: draftId },
      data: {
        postId: post.id,
      },
    });

    return {
      message: '帖子已发布',
      post,
    };
  }

  /**
   * 自动保存草稿（10秒自动保存一次）
   */
  async autoSaveDraft(userId: string, createPostDraftDto: CreatePostDraftDto) {
    return this.createOrUpdateDraft(userId, createPostDraftDto);
  }
}
