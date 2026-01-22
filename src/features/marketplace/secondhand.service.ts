import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * SecondhandService - DISABLED
 * 
 * This service has been disabled because the SecondhandItem table was removed.
 * Secondhand marketplace functionality can now be implemented using regular Posts
 * with specific tags (e.g., #二手交易).
 * 
 * To re-enable:
 * 1. Re-add SecondhandItem model to schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Uncomment the implementation
 */
@Injectable()
export class SecondhandService {
    constructor(private prisma: PrismaService) { }

    async create(_userId: string, _data: any) {
        throw new Error('Secondhand marketplace has been disabled. Please use regular posts with #二手交易 tag instead.');
    }

    async findAll(_page = 1, _limit = 20, _category?: string, _status?: any) {
        throw new Error('Secondhand marketplace has been disabled. Please use regular posts with #二手交易 tag instead.');
    }

    async findOne(_id: string) {
        throw new Error('Secondhand marketplace has been disabled. Please use regular posts with #二手交易 tag instead.');
    }

    async update(_id: string, _userId: string, _data: any) {
        throw new Error('Secondhand marketplace has been disabled. Please use regular posts with #二手交易 tag instead.');
    }

    async remove(_id: string, _userId: string) {
        throw new Error('Secondhand marketplace has been disabled. Please use regular posts with #二手交易 tag instead.');
    }
}
