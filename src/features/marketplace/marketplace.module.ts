import { Module } from '@nestjs/common';
import { SecondhandController } from './secondhand.controller';
import { SecondhandService } from './secondhand.service';
import { StudyResourcesController } from './study-resources.controller';
import { StudyResourcesService } from './study-resources.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SecondhandController, StudyResourcesController],
    providers: [SecondhandService, StudyResourcesService],
    exports: [SecondhandService, StudyResourcesService],
})
export class MarketplaceModule { }
