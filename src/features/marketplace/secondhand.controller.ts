import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    HttpStatus,
} from '@nestjs/common';
import { SecondhandService } from './secondhand.service';
import { Public } from '../../core/common/decorators/public.decorator';

/**
 * 二手市场控制器
 *
 * 注意：此功能已被禁用，请使用普通帖子配合 #二手交易 标签
 */
@Controller('secondhand')
export class SecondhandController {
    constructor(private service: SecondhandService) { }

    @Post()
    create(@Req() req: any, @Body() data: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '二手市场功能已禁用，请使用普通帖子并添加 #二手交易 标签发布商品',
            suggestion: 'POST /posts 并在 tags 中包含 "二手交易"',
        };
    }

    @Public()
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('status') status?: any,
    ) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '二手市场功能已禁用，请使用帖子列表 API 配合 tag=二手交易 参数查询',
            suggestion: 'GET /posts?tag=二手交易',
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '二手市场功能已禁用，请使用帖子详情 API',
            suggestion: `GET /posts/${id}`,
        };
    }

    @Patch(':id')
    update(@Param('id') id: string, @Req() req: any, @Body() data: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '二手市场功能已禁用，请使用帖子更新 API',
            suggestion: `PATCH /posts/${id}`,
        };
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '二手市场功能已禁用，请使用帖子删除 API',
            suggestion: `DELETE /posts/${id}`,
        };
    }
}