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
import { CarpoolService } from './carpool.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('carpool')
export class CarpoolController {
    constructor(private service: CarpoolService) { }

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
    ) {
        return this.service.findAll(
            page ? +page : 1,
            limit ? +limit : 20,
            type,
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
