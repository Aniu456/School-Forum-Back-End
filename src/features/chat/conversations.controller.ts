import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../core/common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * 创建或获取会话
   * POST /conversations
   */
  @Post()
  async createOrGetConversation(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateConversationDto,
  ) {
    return this.conversationsService.createOrGetConversation(userId, createDto);
  }

  /**
   * 获取会话列表
   * GET /conversations?page=1&limit=20
   */
  @Get()
  async getConversations(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.conversationsService.getConversations(userId, page, limit);
  }

  /**
   * 获取未读消息数
   * GET /conversations/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.conversationsService.getUnreadCount(userId);
  }

  /**
   * 获取会话详情
   * GET /conversations/:id
   */
  @Get(':id')
  async getConversation(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.getConversation(conversationId, userId);
  }

  /**
   * 获取会话消息列表
   * GET /conversations/:id/messages?page=1&limit=50
   */
  @Get(':id/messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.conversationsService.getMessages(
      conversationId,
      userId,
      page,
      limit,
    );
  }

  /**
   * 发送消息
   * POST /conversations/:id/messages
   */
  @Post(':id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() sendDto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      conversationId,
      userId,
      sendDto,
    );
  }

  /**
   * 删除消息
   * DELETE /conversations/messages/:messageId
   */
  @Delete('messages/:messageId')
  async deleteMessage(
    @CurrentUser('id') userId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ) {
    return this.conversationsService.deleteMessage(messageId, userId);
  }

  /**
   * 删除会话（会级联删除消息）
   * DELETE /conversations/:id
   */
  @Delete(':id')
  async deleteConversation(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.deleteConversation(conversationId, userId);
  }
}
