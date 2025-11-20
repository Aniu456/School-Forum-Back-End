import { Controller, Get, Query } from '@nestjs/common';
import { HotPostService } from './hot-post.service';
import { TagAlgorithmService } from './tag-algorithm.service';
import { Public } from '../../core/common/decorators/public.decorator';

@Controller('algorithms')
export class AlgorithmsController {
    constructor(
        private hotPostService: HotPostService,
        private tagAlgorithmService: TagAlgorithmService,
    ) { }

    @Public()
    @Get('hot-posts')
    async getHotPosts(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.hotPostService.getHotPosts(limitNum);
    }

    @Public()
    @Get('trending-posts')
    async getTrendingPosts(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.hotPostService.getTrendingPosts(limitNum);
    }

    @Public()
    @Get('quality-posts')
    async getQualityPosts(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.hotPostService.getQualityPosts(limitNum);
    }

    @Public()
    @Get('hot-tags')
    async getHotTags(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.tagAlgorithmService.getHotTags(limitNum);
    }

    @Public()
    @Get('trending-tags')
    async getTrendingTags(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.tagAlgorithmService.getTrendingTags(limitNum);
    }

    @Public()
    @Get('search-tags')
    async searchTags(
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.tagAlgorithmService.searchTags(query, limitNum);
    }

    @Public()
    @Get('related-tags')
    async getRelatedTags(
        @Query('tags') tags: string,
        @Query('limit') limit?: string,
    ) {
        const tagArray = tags.split(',');
        const limitNum = limit ? parseInt(limit, 10) : 5;
        return this.tagAlgorithmService.getRelatedTags(tagArray, limitNum);
    }
}
