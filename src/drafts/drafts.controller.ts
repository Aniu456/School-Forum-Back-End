import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import {
  CreatePostDraftDto,
  UpdatePostDraftDto,
} from './dto/create-post-draft.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts/drafts')
export class DraftsController {
  constructor(private readonly draftsService: DraftsService) {}

  /**
   * 创建或更新草稿（自动保存）
   * POST /posts/drafts
   */
  @Post()
  async createOrUpdateDraft(
    @CurrentUser('id') userId: string,
    @Body() createPostDraftDto: CreatePostDraftDto,
  ) {
    return this.draftsService.createOrUpdateDraft(userId, createPostDraftDto);
  }

  /**
   * 获取草稿列表
   * GET /posts/drafts
   */
  @Get()
  async getDrafts(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.draftsService.getDrafts(userId, page, limit);
  }

  /**
   * 获取单个草稿详情
   * GET /posts/drafts/:id
   */
  @Get(':id')
  async getDraftById(
    @CurrentUser('id') userId: string,
    @Param('id') draftId: string,
  ) {
    return this.draftsService.getDraftById(userId, draftId);
  }

  /**
   * 更新草稿
   * PATCH /posts/drafts/:id
   */
  @Patch(':id')
  async updateDraft(
    @CurrentUser('id') userId: string,
    @Param('id') draftId: string,
    @Body() updatePostDraftDto: UpdatePostDraftDto,
  ) {
    return this.draftsService.updateDraft(userId, draftId, updatePostDraftDto);
  }

  /**
   * 删除草稿
   * DELETE /posts/drafts/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDraft(
    @CurrentUser('id') userId: string,
    @Param('id') draftId: string,
  ) {
    return this.draftsService.deleteDraft(userId, draftId);
  }

  /**
   * 从草稿发布帖子
   * POST /posts/drafts/:id/publish
   */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publishDraft(
    @CurrentUser('id') userId: string,
    @Param('id') draftId: string,
  ) {
    return this.draftsService.publishDraft(userId, draftId);
  }
}
