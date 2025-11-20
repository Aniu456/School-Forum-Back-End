import { Module } from '@nestjs/common';
import { HotPostService } from './hot-post.service';
import { TagAlgorithmService } from './tag-algorithm.service';
import { AlgorithmsController } from './algorithms.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';

@Module({
    imports: [PrismaModule, RedisModule],
    controllers: [AlgorithmsController],
    providers: [HotPostService, TagAlgorithmService],
    exports: [HotPostService, TagAlgorithmService],
})
export class AlgorithmsModule { }
