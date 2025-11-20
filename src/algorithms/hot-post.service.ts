import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HotPostService {
    private readonly logger = new Logger(HotPostService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * 计算帖子热度分数
     * 算法：基于 Reddit 热度算法改进版
     * score = (点赞数 * 10 + 评论数 * 5 + 浏览数 * 0.1) / (时间衰减因子 ^ 1.5)
     * 时间衰减因子 = (当前时间 - 发布时间) / 1小时
     */
    calculateHotScore(post: {
        likeCount: number;
        commentCount: number;
        viewCount: number;
        createdAt: Date;
    }): number {
        const now = new Date();
        const ageHours = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);
        const decayFactor = Math.max(ageHours, 1);

        const engagement =
            post.likeCount * 10 + post.commentCount * 5 + post.viewCount * 0.1;

        const hotScore = engagement / Math.pow(decayFactor, 1.5);
        return hotScore;
    }

    /**
     * 计算趋势分数
     * 算法：关注最近24小时内的互动增长速度
     */
    calculateTrendingScore(post: {
        likeCount: number;
        commentCount: number;
        viewCount: number;
        createdAt: Date;
    }): number {
        const now = new Date();
        const ageHours = (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);

        if (ageHours > 24) return 0;

        const timeBoost = 24 - ageHours;
        const engagement = post.likeCount * 10 + post.commentCount * 5 + post.viewCount * 0.1;

        return engagement * timeBoost;
    }

    /**
     * 计算质量分数
     * 算法：评论数与点赞数的比例，高质量内容通常有更多讨论
     */
    calculateQualityScore(post: {
        likeCount: number;
        commentCount: number;
        viewCount: number;
    }): number {
        if (post.viewCount === 0) return 0;

        const engagementRate =
            (post.likeCount + post.commentCount * 2) / post.viewCount;
        const discussionDepth =
            post.commentCount > 0 ? post.commentCount / (post.likeCount + 1) : 0;

        return engagementRate * 100 + discussionDepth * 20;
    }

    /**
     * 定时任务：每10分钟更新一次热度分数
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async updatePostScores() {
        this.logger.log('开始更新帖子热度分数...');

        try {
            const posts = await this.prisma.post.findMany({
                where: {
                    isDeleted: false,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
                    },
                },
                select: {
                    id: true,
                    likeCount: true,
                    commentCount: true,
                    viewCount: true,
                    createdAt: true,
                },
            });

            for (const post of posts) {
                const hotScore = this.calculateHotScore(post);
                const trendingScore = this.calculateTrendingScore(post);
                const qualityScore = this.calculateQualityScore(post);

                await this.prisma.postScore.upsert({
                    where: { postId: post.id },
                    create: {
                        postId: post.id,
                        hotScore,
                        trendingScore,
                        qualityScore,
                    },
                    update: {
                        hotScore,
                        trendingScore,
                        qualityScore,
                    },
                });
            }

            this.logger.log(`热度分数更新完成，共处理 ${posts.length} 篇帖子`);
        } catch (error) {
            this.logger.error('更新热度分数失败', error);
        }
    }

    /**
     * 获取热门帖子
     */
    async getHotPosts(limit: number = 20) {
        const postScores = await this.prisma.postScore.findMany({
            orderBy: { hotScore: 'desc' },
            take: limit,
        });

        const postIds = postScores.map((ps) => ps.postId);
        const posts = await this.prisma.post.findMany({
            where: { id: { in: postIds } },
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

        const postMap = new Map(posts.map((p) => [p.id, p]));

        return postScores
            .map((ps) => {
                const post = postMap.get(ps.postId);
                return post ? { ...post, hotScore: ps.hotScore } : null;
            })
            .filter((p) => p !== null);
    }

    /**
     * 获取趋势帖子
     */
    async getTrendingPosts(limit: number = 20) {
        const postScores = await this.prisma.postScore.findMany({
            where: {
                trendingScore: { gt: 0 },
            },
            orderBy: { trendingScore: 'desc' },
            take: limit,
        });

        return postScores.map((ps) => ({
            ...ps.post,
            trendingScore: ps.trendingScore,
        }));
    }

    /**
     * 获取优质帖子
     */
    async getQualityPosts(limit: number = 20) {
        const postScores = await this.prisma.postScore.findMany({
            orderBy: { qualityScore: 'desc' },
            take: limit,
        });

        const postIds = postScores.map((ps) => ps.postId);
        const posts = await this.prisma.post.findMany({
            where: { id: { in: postIds } },
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

        const postMap = new Map(posts.map((p) => [p.id, p]));

        return postScores
            .map((ps) => {
                const post = postMap.get(ps.postId);
                return post ? { ...post, qualityScore: ps.qualityScore } : null;
            })
            .filter((p) => p !== null);
    }
}
