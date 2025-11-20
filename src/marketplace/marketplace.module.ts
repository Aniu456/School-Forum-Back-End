import { Module } from '@nestjs/common';
import { SecondhandController } from './secondhand.controller';
import { SecondhandService } from './secondhand.service';
import { StudyResourcesController } from './study-resources.controller';
import { StudyResourcesService } from './study-resources.service';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { LostFoundController } from './lost-found.controller';
import { LostFoundService } from './lost-found.service';
import { CarpoolController } from './carpool.controller';
import { CarpoolService } from './carpool.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [
        SecondhandController,
        StudyResourcesController,
        ClubsController,
        LostFoundController,
        CarpoolController,
    ],
    providers: [
        SecondhandService,
        StudyResourcesService,
        ClubsService,
        LostFoundService,
        CarpoolService,
    ],
    exports: [
        SecondhandService,
        StudyResourcesService,
        ClubsService,
        LostFoundService,
        CarpoolService,
    ],
})
export class MarketplaceModule { }
