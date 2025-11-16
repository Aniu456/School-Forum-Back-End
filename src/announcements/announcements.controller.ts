import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    /**
     * 创建公告（管理员）
     * POST /announcements
     */
    @Roles(Role.ADMIN)
    @Post()
    async create(
        @CurrentUser('id') authorId: string,
        @Body() createAnnouncementDto: CreateAnnouncementDto,
    ) {
        return this.announcementsService.create(authorId, createAnnouncementDto);
    }

    /**
     * 获取公告列表（公开）
     * GET /announcements
     */
    @Public()
    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @CurrentUser('role') userRole?: Role,
    ) {
        return this.announcementsService.findAll(page, limit, userRole);
    }

    /**
     * 获取公告详情（公开）
     * GET /announcements/:id
     */
    @Public()
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.announcementsService.findOne(id);
    }

    /**
     * 更新公告（管理员）
     * PUT /announcements/:id
     */
    @Roles(Role.ADMIN)
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    ) {
        return this.announcementsService.update(id, updateAnnouncementDto);
    }

    /**
     * 删除公告（管理员）
     * DELETE /announcements/:id
     */
    @Roles(Role.ADMIN)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.announcementsService.remove(id);
    }

    /**
     * 获取所有公告（管理员）
     * GET /admin/announcements
     */
    @Roles(Role.ADMIN)
    @Get('admin/all')
    async findAllForAdmin(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.announcementsService.findAllForAdmin(page, limit);
    }
}
