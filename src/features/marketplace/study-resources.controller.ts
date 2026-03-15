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
import { StudyResourcesService } from './study-resources.service';
import { Public } from '../../core/common/decorators/public.decorator';

/**
 * 学习资源控制器
 *
 * 注意：此功能已被禁用，请使用普通帖子配合 #学习资源 标签
 */
@Controller('study-resources')
export class StudyResourcesController {
    constructor(private service: StudyResourcesService) { }

    @Post()
    create(@Req() req: any, @Body() data: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用，请使用普通帖子并添加 #学习资源 标签分享资源',
            suggestion: 'POST /posts 并在 tags 中包含 "学习资源"',
        };
    }

    @Public()
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('type') type?: any,
    ) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用，请使用帖子列表 API 配合 tag=学习资源 参数查询',
            suggestion: 'GET /posts?tag=学习资源',
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用，请使用帖子详情 API',
            suggestion: `GET /posts/${id}`,
        };
    }

    @Post(':id/download')
    download(@Param('id') id: string) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用',
        };
    }

    @Patch(':id')
    update(@Param('id') id: string, @Req() req: any, @Body() data: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用，请使用帖子更新 API',
            suggestion: `PATCH /posts/${id}`,
        };
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: '学习资源功能已禁用，请使用帖子删除 API',
            suggestion: `DELETE /posts/${id}`,
        };
    }
}