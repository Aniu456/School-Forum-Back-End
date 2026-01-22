import {
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreatePostDraftDto,
  UpdatePostDraftDto,
} from './dto/create-post-draft.dto';

/**
 * DraftsService - DISABLED
 * 
 * This service has been disabled because the PostDraft table was removed.
 * Draft functionality can be implemented on the frontend using localStorage
 * or by adding an isDraft field to the Post model.
 * 
 * To re-enable:
 * 1. Re-add PostDraft model to schema.prisma
 * 2. Run: npx prisma migrate dev
 * 3. Uncomment the implementation below
 */
@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) { }

  async createOrUpdateDraft(
    _userId: string,
    _createPostDraftDto: CreatePostDraftDto,
  ) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async getDrafts(_userId: string, _page: number = 1, _limit: number = 20) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async getDraftById(_userId: string, _draftId: string) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async updateDraft(
    _userId: string,
    _draftId: string,
    _updatePostDraftDto: UpdatePostDraftDto,
  ) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async deleteDraft(_userId: string, _draftId: string) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async publishDraft(_userId: string, _draftId: string) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }

  async autoSaveDraft(_userId: string, _createPostDraftDto: CreatePostDraftDto) {
    throw new Error('Draft functionality has been disabled. Please use frontend localStorage for draft storage.');
  }
}
