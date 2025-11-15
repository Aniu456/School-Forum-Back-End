import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 搜索帖子
   */
  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'relevance' | 'createdAt' | 'viewCount' = 'relevance',
    tag?: string,
  ) {
    const skip = (page - 1) * limit;

    // 构建搜索条件
    const where: any = {
      isDeleted: false,
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    // 如果指定了标签，添加标签筛选
    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    // 构建排序条件
    let orderBy: any;
    if (sortBy === 'createdAt') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'viewCount') {
      orderBy = { viewCount: 'desc' };
    } else {
      // relevance: 按创建时间倒序（简单实现，可以后续优化为相关度评分）
      orderBy = { createdAt: 'desc' };
    }

    // 执行搜索
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          images: true,
          tags: true,
          viewCount: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    // 获取每个帖子的点赞数
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const likeCount = await this.prisma.like.count({
          where: {
            targetId: post.id,
            targetType: 'POST',
          },
        });

        // 截取内容摘要（前200字符）
        const contentPreview =
          post.content.length > 200
            ? post.content.substring(0, 200) + '...'
            : post.content;

        return {
          ...post,
          content: contentPreview,
          likeCount,
          commentCount: post._count.comments,
          _count: undefined,
        };
      }),
    );

    return {
      data: postsWithCounts,
      meta: {
        page,
        limit,
        total,
        query,
      },
    };
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      isBanned: false,
      OR: [
        {
          username: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          nickname: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        postCount: user._count.posts,
        _count: undefined,
      })),
      meta: {
        page,
        limit,
        total,
        query,
      },
    };
  }

  /**
   * 获取热门搜索标签
   */
  async getPopularTags(limit: number = 10) {
    // 获取所有帖子的标签
    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        tags: true,
      },
    });

    // 统计标签频率
    const tagCount: Record<string, number> = {};
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // 排序并返回前N个标签
    const sortedTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  }
}
