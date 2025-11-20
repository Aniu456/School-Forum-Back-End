import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from '../admin/admin.service';
import { PrismaModule } from '../core/prisma/prisma.module';
import { PointsModule } from '../users/points.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PointsModule)],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule { }
