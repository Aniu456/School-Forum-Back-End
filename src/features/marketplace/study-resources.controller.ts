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
} from '@nestjs/common';
import { StudyResourcesService } from './study-resources.service';
import { Public } from '../../core/common/decorators/public.decorator';

@Controller('study-resources')
export class StudyResourcesController {
    constructor(private service: StudyResourcesService) { }

    @Post()
    create(@Req() req: any, @Body() data: any) {
        return this.service.create(req.user.id, data);
    }

    @Public()
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('type') type?: any,
    ) {
        return this.service.findAll(
            page ? +page : 1,
            limit ? +limit : 20,
            category,
            type,
        );
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post(':id/download')
    download(@Param('id') id: string) {
        return this.service.incrementDownload(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Req() req: any, @Body() data: any) {
        return this.service.update(id, req.user.id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.service.remove(id, req.user.id);
    }
}
