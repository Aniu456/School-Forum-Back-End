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
import { LostFoundService } from './lost-found.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('lost-found')
export class LostFoundController {
    constructor(private service: LostFoundService) { }

    @Post()
    create(@Req() req: any, @Body() data: any) {
        return this.service.create(req.user.id, data);
    }

    @Public()
    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: any,
        @Query('status') status?: any,
        @Query('category') category?: string,
    ) {
        return this.service.findAll(
            page ? +page : 1,
            limit ? +limit : 20,
            type,
            status,
            category,
        );
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
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
