import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../core/common/decorators/current-user.decorator';
import { NotificationType } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 获取通知列表
   * GET /notifications
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isRead', new DefaultValuePipe(undefined))
    isRead?: string,
    @Query('type') type?: NotificationType,
  ) {
    // 转换 isRead 参数
    let isReadBool: boolean | undefined;
    if (isRead === 'true') {
      isReadBool = true;
    } else if (isRead === 'false') {
      isReadBool = false;
    }

    return this.notificationsService.findAll(
      userId,
      page,
      limit,
      isReadBool,
      type,
    );
  }

  /**
   * 获取未读通知数量
   * GET /notifications/unread/count
   */
  @Get('unread/count')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * 标记单个通知为已读
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  /**
   * 批量标记所有通知为已读
   * POST /notifications/read-all
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * 删除通知
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.remove(notificationId, userId);
  }
}
