import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { AlgorithmsController } from './algorithms.controller';
import { HotPostService } from './hot-post.service';
import { TagAlgorithmService } from './tag-algorithm.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [RecommendationsController, AlgorithmsController],
  providers: [RecommendationsService, HotPostService, TagAlgorithmService],
  exports: [RecommendationsService, HotPostService, TagAlgorithmService],
})
export class RecommendationsModule { }
