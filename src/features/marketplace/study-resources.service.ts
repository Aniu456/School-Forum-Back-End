import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/**
 * StudyResourcesService - DISABLED
 * 
 * This service has been disabled because the StudyResource table was removed.
 * Study resources functionality can now be implemented using regular Posts
 * with specific tags (e.g., #学习资源).
 * 
 * To re-enable:
 * 1. Re-add StudyResource model to schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Uncomment the implementation
 */
@Injectable()
export class StudyResourcesService {
  constructor(private prisma: PrismaService) {}

  async create(_userId: string, _data: any) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }

  async findAll(_page = 1, _limit = 20, _category?: string, _type?: any) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }

  async findOne(_id: string) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }

  async incrementDownload(_id: string) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }

  async update(_id: string, _userId: string, _data: any) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }

  async remove(_id: string, _userId: string) {
    throw new Error('Study resources has been disabled. Please use regular posts with #学习资源 tag instead.');
  }
}
