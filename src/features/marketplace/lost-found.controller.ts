import { Controller } from '@nestjs/common';

/**
 * LostFoundController 已废弃。
 * 失物招领功能已统一归入帖子模块，通过 /posts + tags 实现。
 *
 * 该控制器仅保留空壳以避免历史引用导致的编译错误，
 * 未在任何模块中注册，不会暴露实际路由。
 */
@Controller('lost-found')
export class LostFoundController { }
