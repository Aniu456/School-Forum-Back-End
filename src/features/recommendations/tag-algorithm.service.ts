import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface TagStats {
    tag: string;
    postCount: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    score: number;
}

/**
 * 标签算法服务
 * 注意：Topic 模型已从 schema 中移除，相关功能已调整
 */
@Injectable()
export class TagAlgorithmService {
    private readonly logger = new Logger(TagAlgorithmService.name);
    private readonly HOT_TAGS_KEY = 'hot_tags';
    private readonly TRENDING_TAGS_KEY = 'trending_tags';

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

    /**
     * 计算标签热度分数
     */
    private calculateTagScore(stats: Omit<TagStats, 'score'>): number {
        return (
            stats.postCount * 5 +
            stats.totalViews * 0.1 +
            stats.totalLikes * 10 +
            stats.totalComments * 8
        );
    }

    /**
     * 定时任务：每小时更新一次热门标签
     */
    @Cron(CronExpression.EVERY_HOUR)
    async updateHotTags() {
        this.logger.log('开始更新热门标签...');

        try {
            const posts = await this.prisma.post.findMany({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
                select: {
                    tags: true,
                    viewCount: true,
                    likeCount: true,
                    commentCount: true,
                },
            });

            const tagStatsMap = new Map<string, Omit<TagStats, 'score'>>();

            for (const post of posts) {
                for (const tag of post.tags) {
                    const stats = tagStatsMap.get(tag) || {
                        tag,
                        postCount: 0,
                        totalViews: 0,
                        totalLikes: 0,
                        totalComments: 0,
                    };

                    stats.postCount++;
                    stats.totalViews += post.viewCount;
                    stats.totalLikes += post.likeCount;
                    stats.totalComments += post.commentCount;

                    tagStatsMap.set(tag, stats);
                }
            }

            const tagStats: TagStats[] = Array.from(tagStatsMap.values())
                .map((stats) => ({
                    ...stats,
                    score: this.calculateTagScore(stats),
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 50);

            await this.redis.set(
                this.HOT_TAGS_KEY,
                JSON.stringify(tagStats),
                60 * 60,
            );

            this.logger.log(`热门标签更新完成，共 ${tagStats.length} 个标签`);
        } catch (error) {
            this.logger.error('更新热门标签失败', error);
        }
    }

    /**
     * 获取热门标签
     */
    async getHotTags(limit: number = 20): Promise<TagStats[]> {
        const cached = await this.redis.get(this.HOT_TAGS_KEY);
        if (cached) {
            const tags = JSON.parse(cached) as TagStats[];
            return tags.slice(0, limit);
        }

        await this.updateHotTags();
        return this.getHotTags(limit);
    }

    /**
     * 获取趋势标签（最近24小时）
     */
    async getTrendingTags(limit: number = 10): Promise<TagStats[]> {
        const cached = await this.redis.get(this.TRENDING_TAGS_KEY);
        if (cached) {
            return JSON.parse(cached).slice(0, limit);
        }

        const posts = await this.prisma.post.findMany({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
            select: {
                tags: true,
                viewCount: true,
                likeCount: true,
                commentCount: true,
            },
        });

        const tagStatsMap = new Map<string, Omit<TagStats, 'score'>>();

        for (const post of posts) {
            for (const tag of post.tags) {
                const stats = tagStatsMap.get(tag) || {
                    tag,
                    postCount: 0,
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                };

                stats.postCount++;
                stats.totalViews += post.viewCount;
                stats.totalLikes += post.likeCount;
                stats.totalComments += post.commentCount;

                tagStatsMap.set(tag, stats);
            }
        }

        const tagStats: TagStats[] = Array.from(tagStatsMap.values())
            .map((stats) => ({
                ...stats,
                score: this.calculateTagScore(stats),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        await this.redis.set(
            this.TRENDING_TAGS_KEY,
            JSON.stringify(tagStats),
            60 * 60,
        );

        return tagStats;
    }

    /**
     * 获取相关标签推荐
     */
    async getRelatedTags(tags: string[], limit: number = 5): Promise<string[]> {
        if (tags.length === 0) return [];

        const posts = await this.prisma.post.findMany({
            where: {
                tags: { hasSome: tags },
            },
            select: {
                tags: true,
            },
            take: 100,
        });

        const tagFrequency = new Map<string, number>();

        for (const post of posts) {
            for (const tag of post.tags) {
                if (!tags.includes(tag)) {
                    tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
                }
            }
        }

        return Array.from(tagFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag]) => tag);
    }

    /**
     * 搜索标签（从帖子标签中搜索）
     */
    async searchTags(query: string, limit: number = 10): Promise<string[]> {
        // 从最近帖子中查找匹配的标签
        const posts = await this.prisma.post.findMany({
            select: {
                tags: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 500,
        });

        const tagSet = new Set<string>();
        const matchingTags: string[] = [];

        for (const post of posts) {
            for (const tag of post.tags) {
                if (!tagSet.has(tag) && tag.toLowerCase().includes(query.toLowerCase())) {
                    tagSet.add(tag);
                    matchingTags.push(tag);
                    if (matchingTags.length >= limit) break;
                }
            }
            if (matchingTags.length >= limit) break;
        }

        return matchingTags;
    }
}
