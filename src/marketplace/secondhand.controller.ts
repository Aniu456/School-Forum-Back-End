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
import { SecondhandService } from './secondhand.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('secondhand')
export class SecondhandController {
    constructor(private service: SecondhandService) { }

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
        @Query('status') status?: any,
    ) {
        return this.service.findAll(
            page ? +page : 1,
            limit ? +limit : 20,
            category,
            status,
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
