import { Injectable, Logger } from '@nestjs/common';

/**
 * 热帖算法服务 - 已禁用
 * 原因：PostScore 模型已从 schema 中移除
 * 
 * 替代方案：使用 RecommendationsService 中基于 Post 字段的排序
 * - 热门帖子：按 (likeCount + commentCount) 排序
 * - 趋势帖子：按最近创建时间排序
 * - 优质帖子：按 likeCount 排序
 */
@Injectable()
export class HotPostService {
    private readonly logger = new Logger(HotPostService.name);

    constructor() {
        this.logger.warn('HotPostService 已禁用 - PostScore 模型不存在');
    }

    /**
     * 计算帖子热度分数
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
        const engagement = post.likeCount * 10 + post.commentCount * 5 + post.viewCount * 0.1;
        return engagement / Math.pow(decayFactor, 1.5);
    }

    /**
     * 定时任务已禁用
     */
    async updatePostScores() {
        this.logger.warn('updatePostScores 已禁用 - 请使用 RecommendationsService');
    }

    /**
     * 获取热门帖子 - 已禁用
     */
    async getHotPosts(_limit: number = 20) {
        this.logger.warn('getHotPosts 已禁用 - 请使用 RecommendationsService.getHotPosts()');
        return [];
    }

    /**
     * 获取趋势帖子 - 已禁用
     */
    async getTrendingPosts(_limit: number = 20) {
        this.logger.warn('getTrendingPosts 已禁用 - 请使用 RecommendationsService.getTrendingPosts()');
        return [];
    }

    /**
     * 获取优质帖子 - 已禁用
     */
    async getQualityPosts(_limit: number = 20) {
        this.logger.warn('getQualityPosts 已禁用 - 请使用 RecommendationsService');
        return [];
    }
}
